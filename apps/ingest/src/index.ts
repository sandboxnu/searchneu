import { getDb } from "@sneu/db/pg";
import { termsT } from "@sneu/db/schema";
import { gt } from "drizzle-orm";
import {
  APPLY_TERMS,
  BannerClient,
  COURSE_TTL_MS,
  MODE,
  PASS_EVERY_MS,
} from "@sneu/scraper/ingest";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { runTermPass } from "./pass";
import { notify } from "./notify";
import { attachLogger } from "./log";

/**
 * SIGTERM drains in-flight Banner requests and stops the loop after the
 * current pass, so replacing an instance never truncates a sweep.
 */
const shutdown = new AbortController();
process.on("SIGTERM", () => shutdown.abort());
process.on("SIGINT", () => shutdown.abort());

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

async function activeTerms(db: ReturnType<typeof getDb>): Promise<string[]> {
  const rows = await db
    .select({ term: termsT.term })
    .from(termsT)
    .where(gt(termsT.activeUntil, new Date()));

  // a term code may have several partOfTerm rows; each code is swept once
  return [...new Set(rows.map((row) => row.term))];
}

async function main(): Promise<void> {
  const db = getDb();
  const emitter = new ScraperEventEmitter();
  attachLogger(emitter);

  console.log(
    JSON.stringify({
      msg: "ingest daemon starting",
      mode: MODE,
      applyTerms: APPLY_TERMS.length > 0 ? APPLY_TERMS : "all",
      passEveryMs: PASS_EVERY_MS,
      courseTtlMs: COURSE_TTL_MS,
    }),
  );

  while (!shutdown.signal.aborted) {
    const startedAt = Date.now();

    try {
      const terms = await activeTerms(db);

      for (const term of terms) {
        if (shutdown.signal.aborted) break;

        const client = new BannerClient({
          signal: shutdown.signal,
          emitter,
        });

        const outcome = await runTermPass({
          db,
          client,
          term,
          mode: MODE,
          applyTerms: APPLY_TERMS,
          emitter,
          notify: (changeset) => notify(db, changeset),
        });

        console.log(
          JSON.stringify({
            msg: "pass complete",
            term,
            pass: outcome.pass,
            courses: outcome.courses,
            status: outcome.status,
            runId: outcome.runId,
            applied: outcome.applied,
            stats: outcome.plan?.stats,
            violations: outcome.check?.violations.map((v) => v.rule),
            warnings: outcome.check?.warnings.map((v) => v.message),
          }),
        );
      }
    } catch (error) {
      // the daemon survives a failed pass: a restart would land straight back
      // in the same failure
      console.error(
        JSON.stringify({ msg: "pass loop failed", error: String(error) }),
      );
    }

    // a pass that overran its interval starts the next one immediately
    const elapsed = Date.now() - startedAt;
    await sleep(Math.max(0, PASS_EVERY_MS - elapsed), shutdown.signal);
  }

  console.log(JSON.stringify({ msg: "shutdown complete" }));
}

void main();
