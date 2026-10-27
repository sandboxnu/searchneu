import { getDb } from "@sneu/db/pg";
import { termsT } from "@sneu/db/schema";
import { updateTerm } from "@sneu/scraper/update";
import { gt } from "drizzle-orm";

/**
 * How long to wait between update passes. Defaults to five minutes, matching
 * the cron schedule this daemon is modelled on.
 */
const INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS ?? 5 * 60 * 1000);

/**
 * Vercel sends SIGTERM before replacing or stopping an instance. Aborting this
 * controller stops the loop after the pass that is currently in flight, so a
 * rollout never kills a scrape halfway through a term.
 */
const shutdown = new AbortController();
process.on("SIGTERM", () => shutdown.abort());
process.on("SIGINT", () => shutdown.abort());

/** Waits for `ms`, returning early once a shutdown has been requested. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };

    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
  });
}

/** Scrapes every currently active term once. */
async function runPass(db: ReturnType<typeof getDb>): Promise<void> {
  const rows = await db
    .select({ term: termsT.term })
    .from(termsT)
    .where(gt(termsT.activeUntil, new Date()));

  // a term code may have several partOfTerm rows, so scrape each code once
  const terms = [...new Set(rows.map((row) => row.term))];
  console.log({ terms }, "terms to update");

  for (const term of terms) {
    if (shutdown.signal.aborted) return;
    await updateTerm(term, db, console);
  }
}

async function main(): Promise<void> {
  const db = getDb();

  while (!shutdown.signal.aborted) {
    try {
      await runPass(db);
    } catch (error) {
      // a failed pass should not take the daemon down, Vercel would just
      // restart it into the same failure. log and retry on the next tick.
      console.error(error, "update pass failed");
    }

    await sleep(INTERVAL_MS, shutdown.signal);
  }

  console.log("shutdown complete");
}

void main();
