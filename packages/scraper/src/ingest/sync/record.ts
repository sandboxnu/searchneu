/**
 * Step 11 - writes what a pass saw to `ingest_runs` and `ingest_drift`.
 *
 * This runs on every pass including a blocked or failed one, and is the only
 * thing a shadow pass writes anywhere.
 */

import { ingestDriftT, ingestRunsT } from "@sneu/db/schema";
import type { Tx } from "../../upload/types";
import type { Mode } from "../config";
import type { TombstoneChange } from "./tombstone";
import type { Plan, PlanProblem } from "./plan";
import type { Violation } from "./check";

export type RunStatus = "ok" | "blocked" | "failed";

export interface RunRecord {
  term: string;
  pass: "light" | "deep";
  mode: Mode;
  status: RunStatus;
  startedAt: Date;
  sweep?: {
    count: number;
    reportedTotal: number;
    duplicates: number;
  };
  detail?: { tasks: number; failures: number };
  plan?: Plan;
  violations?: Violation[];
  warnings?: Violation[];
  error?: string;
  /** anything the caller noticed that the plan itself does not model */
  extraProblems?: PlanProblem[];
}

export async function record(tx: Tx, run: RunRecord): Promise<number> {
  const [row] = await tx
    .insert(ingestRunsT)
    .values({
      term: run.term,
      pass: run.pass,
      mode: run.mode,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: new Date(),
      sweepCount: run.sweep?.count ?? null,
      sweepReported: run.sweep?.reportedTotal ?? null,
      sweepDuplicates: run.sweep?.duplicates ?? null,
      detailTasks: run.detail?.tasks ?? null,
      detailFailures: run.detail?.failures ?? null,
      stats: run.plan?.stats ?? null,
      violations: [...(run.violations ?? []), ...(run.warnings ?? [])],
      error: run.error ?? null,
    })
    .returning({ id: ingestRunsT.id });

  const drift = [
    ...(run.plan ? driftFromPlan(run.plan) : []),
    ...(run.extraProblems ?? []).map((problem) => ({
      kind: problem.kind,
      entity: problem.entity,
      key: problem.key,
      detail: problem.detail ?? null,
    })),
  ];

  if (drift.length > 0) {
    await tx
      .insert(ingestDriftT)
      .values(drift.map((d) => ({ ...d, runId: row.id })));
  }

  return row.id;
}

function driftFromPlan(plan: Plan) {
  const rows = plan.problems.map((problem) => ({
    kind: problem.kind,
    entity: problem.entity,
    key: problem.key,
    detail: problem.detail ?? null,
  }));

  for (const part of plan.parts) {
    rows.push(...tombstoneDrift(part.tombstones.courses, "course"));
    rows.push(...tombstoneDrift(part.tombstones.sections, "section"));
  }

  return rows;
}

function tombstoneDrift(changes: TombstoneChange[], entity: string) {
  return changes.map((change) => ({
    kind: `${entity}-${change.action === "mark" ? "missing" : change.action === "restore" ? "returned" : "tombstoned"}`,
    entity,
    key: change.key,
    detail: {
      missingSince: change.missingSince?.toISOString() ?? null,
    } as Record<string, unknown>,
  }));
}
