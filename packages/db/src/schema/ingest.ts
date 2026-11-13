import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** One row per term per ingest pass, including blocked and failed ones. */
export const ingestRunsT = pgTable(
  "ingest_runs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 }).notNull(),
    /** "light" or "deep" */
    pass: text().notNull(),
    /** "shadow" or "apply" */
    mode: text().notNull(),
    /** "ok", "blocked" by the rails, or "failed" outright */
    status: text().notNull(),
    startedAt: timestamp().notNull(),
    finishedAt: timestamp().notNull().defaultNow(),
    sweepCount: integer(),
    sweepReported: integer(),
    sweepDuplicates: integer(),
    detailTasks: integer(),
    detailFailures: integer(),
    /** what the plan would change, applied or not */
    stats: jsonb(),
    violations: jsonb(),
    error: text(),
  },
  (table) => [index("ingest_runs_term_idx").on(table.term, table.startedAt)],
);

/** Anything a pass noticed that a human may need to act on. */
export const ingestDriftT = pgTable(
  "ingest_drift",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    runId: integer()
      .notNull()
      .references(() => ingestRunsT.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    /** "course", "section", "subject", "campus", "building", "sweep" */
    entity: text().notNull(),
    /** CRN, register, or config code, depending on the entity */
    key: text().notNull(),
    detail: jsonb(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("ingest_drift_run_idx").on(table.runId),
    index("ingest_drift_kind_idx").on(table.kind),
  ],
);
