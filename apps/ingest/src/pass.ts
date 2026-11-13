/**
 * One reconciliation pass over one term.
 *
 * Every pass runs a light round (seats, waitlists, tombstones) and then, if
 * any courses are due, scrapes them and runs a deep round that writes them.
 * The light round commits first, so seats never wait on a scrape.
 */

import {
  apply,
  applyScrapes,
  assemble,
  check,
  derive,
  dueCourses,
  execute,
  hydrate,
  loadState,
  plan,
  record,
  sweep,
  type Changeset,
  type CheckResult,
  type ExecuteResult,
  type Mode,
  type PassKind,
  type Plan,
  type RunStatus,
  type SweepResult,
  type TermPartState,
  type TermSnapshot,
  type TermState,
} from "@sneu/scraper/ingest";
import type { getDb } from "@sneu/db/pg";
import type { ScraperEventEmitter } from "@sneu/scraper/events";
import {
  COURSE_BUDGET,
  COURSE_TTL_MS,
  RAILS,
  TOMBSTONE,
} from "@sneu/scraper/ingest";

type Db = ReturnType<typeof getDb>;

export interface PassOptions {
  db: Db;
  client: Parameters<typeof sweep>[0];
  term: string;
  mode: Mode;
  /** empty means all of them */
  applyTerms: readonly string[];
  now?: Date;
  emitter?: ScraperEventEmitter;
  /** sends seat notifications for an applied changeset */
  notify: (changeset: Changeset) => Promise<{ seat: number; waitlist: number }>;
}

export interface PassOutcome {
  term: string;
  /** the last round the pass ran */
  pass: PassKind;
  status: RunStatus;
  runId: number;
  plan: Plan | null;
  check: CheckResult | null;
  applied: boolean;
  changeset: Changeset | null;
  /** courses due this pass, and how many of them were scraped */
  courses: { due: number; scraped: number };
}

export async function runTermPass(options: PassOptions): Promise<PassOutcome> {
  const { db, client, term, emitter } = options;
  const now = options.now ?? new Date();
  const startedAt = new Date();

  let swept: SweepResult | undefined;
  let details: ExecuteResult = { courses: [], failures: [] };
  let due = 0;

  try {
    swept = await sweep(client, term, emitter);

    const loaded = await db.transaction((tx) => loadState(tx, term));
    if (loaded.parts.size === 0) {
      throw new Error(`term ${term} has no rows in the catalog`);
    }

    const split = isSplit(loaded);
    const unknownParts = split ? unconfiguredParts(swept, loaded) : [];
    const state = liveOnly(loaded, now);

    let snapshot: TermSnapshot = assemble(swept);

    const round = {
      ...options,
      split,
      sweep: swept,
      startedAt,
      now,
      unknownParts,
    };

    const light = await syncRound({
      ...round,
      pass: "light",
      snapshot,
      state,
      details,
      due,
      scraped: new Set(),
    });

    // judged on the state the pass started with, so a row the light round
    // just restored still counts as returning
    const toScrape = dueCourses(snapshot, state, {
      now,
      ttlMs: COURSE_TTL_MS,
      budget: COURSE_BUDGET,
      split,
    });
    due = toScrape.length;
    if (due === 0) return { ...light, courses: { due, scraped: 0 } };

    snapshot = hydrate(snapshot, state);

    emitter?.emit("scrape:detail:start");
    details = await execute(
      client,
      term,
      snapshot,
      toScrape,
      // requisites name subjects in plain text, so they match the decoded names
      snapshot.subjects,
      emitter,
    );
    emitter?.emit("scrape:detail:done");

    snapshot = derive(applyScrapes(snapshot, details));

    const refreshed = await db.transaction((tx) => loadState(tx, term));
    const deep = await syncRound({
      ...round,
      pass: "deep",
      snapshot,
      state: liveOnly(refreshed, now),
      details,
      due,
      scraped: new Set(details.courses.map((course) => course.register)),
    });

    return { ...deep, courses: { due, scraped: details.courses.length } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const pass: PassKind = due > 0 ? "deep" : "light";
    const runId = await db.transaction((tx) =>
      record(tx, {
        term,
        pass,
        mode: options.mode,
        status: "failed",
        startedAt,
        sweep: swept && {
          count: swept.sections.length,
          reportedTotal: swept.reportedTotal,
          duplicates: swept.duplicates,
        },
        detail: { tasks: due, failures: details.failures.length },
        error: message,
      }),
    );

    return {
      term,
      pass,
      status: "failed",
      runId,
      plan: null,
      check: null,
      applied: false,
      changeset: null,
      courses: { due, scraped: details.courses.length },
    };
  }
}

async function syncRound(input: {
  db: Db;
  term: string;
  pass: PassKind;
  mode: Mode;
  applyTerms: readonly string[];
  snapshot: TermSnapshot;
  state: TermState;
  /** from the full state, since expired parts still decide how a term splits */
  split: boolean;
  sweep: SweepResult;
  details: ExecuteResult;
  due: number;
  scraped: ReadonlySet<string>;
  startedAt: Date;
  now: Date;
  unknownParts: string[];
  notify: (changeset: Changeset) => Promise<{ seat: number; waitlist: number }>;
}): Promise<Omit<PassOutcome, "courses">> {
  const termPlan = plan(
    input.snapshot,
    input.state,
    termConfig(input.state, input.split),
    {
      pass: input.pass,
      now: input.now,
      tombstone: TOMBSTONE,
      scraped: input.scraped,
    },
  );

  const verdict = check({
    plan: termPlan,
    sweep: input.sweep,
    detail: {
      tasks: input.due,
      failures: input.details.failures.length,
    },
    unknownParts: input.unknownParts,
    rails: RAILS,
  });

  const mayApply =
    input.mode === "apply" &&
    (input.applyTerms.length === 0 || input.applyTerms.includes(input.term));
  const status: RunStatus = verdict.ok ? "ok" : "blocked";

  let changeset: Changeset | null = null;
  if (mayApply && verdict.ok) {
    changeset = await input.db.transaction((tx) =>
      apply(tx, termPlan, input.state.lookups),
    );
  }

  const runId = await input.db.transaction((tx) =>
    record(tx, {
      term: input.term,
      pass: input.pass,
      mode: input.mode,
      status,
      startedAt: input.startedAt,
      sweep: {
        count: input.sweep.sections.length,
        reportedTotal: input.sweep.reportedTotal,
        duplicates: input.sweep.duplicates,
      },
      detail: {
        tasks: input.due,
        failures: input.details.failures.length,
      },
      plan: termPlan,
      violations: verdict.violations,
      warnings: verdict.warnings,
      extraProblems: [
        ...scrapeFailureDrift(input.details),
        ...input.unknownParts.map((code) => ({
          kind: "unknown-part",
          entity: "term",
          key: code,
        })),
      ],
    }),
  );

  if (changeset) {
    const sent = await input.notify(changeset);
    if (sent.seat + sent.waitlist > 0) {
      console.log(
        JSON.stringify({
          msg: "notifications sent",
          term: input.term,
          ...sent,
        }),
      );
    }
  }

  return {
    term: input.term,
    pass: input.pass,
    status,
    runId,
    plan: termPlan,
    check: verdict,
    applied: changeset !== null,
    changeset,
  };
}

/**
 * A part stops being written once its own add/drop deadline passes. Banner
 * serves a finished session's sections forever, so the only thing that
 * freezes them is leaving the part out of the state `plan` sees — which also
 * keeps its rows out of the stats, the rails and the tombstone pass.
 */
function liveOnly(state: TermState, now: Date): TermState {
  const parts = new Map<string, TermPartState>();
  for (const [code, part] of state.parts) {
    if (part.term.activeUntil > now) parts.set(code, part);
  }
  return { ...state, parts };
}

function isSplit(state: TermState): boolean {
  return [...state.parts.values()].some((p) => p.term.partOfTerm !== "1");
}

/**
 * Banner part codes with no term row at all. A configured part that has
 * merely expired is not one of these: that is ordinary, every pass, and
 * warning about it would bury the codes that do need adding to the manifest.
 */
function unconfiguredParts(sweep: SweepResult, state: TermState): string[] {
  const configured = new Set(state.parts.keys());
  const unknown = new Set<string>();

  for (const section of sweep.sections) {
    if (!configured.has(section.partOfTerm)) unknown.add(section.partOfTerm);
  }

  return [...unknown].sort();
}

/** Term metadata comes from the catalog; `cli upload` keeps it in step. */
function termConfig(state: TermState, split: boolean) {
  const parts = [...state.parts.values()];
  const primary = parts[0];

  return {
    name: primary.term.name,
    activeUntil: primary.term.activeUntil,
    splitByPartOfTerm: split,
    parts: parts.map((p) => ({
      code: p.term.partOfTerm,
      name: p.term.name,
      activeUntil: p.term.activeUntil,
    })),
  };
}

function scrapeFailureDrift(details: ExecuteResult) {
  return details.failures.map((failure) => ({
    kind: "scrape-failure",
    entity: "course",
    key: failure.register,
    detail: { message: failure.message },
  }));
}
