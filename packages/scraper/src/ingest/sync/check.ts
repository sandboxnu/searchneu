/**
 * Step 9 - the tripwire between planning and applying. Pure.
 *
 * A blocked pass writes nothing and is retried from scratch next time; the
 * pipeline holds no state a refusal can corrupt.
 */

import type { SweepResult } from "../sweep";
import type { Plan, PlanProblem } from "./plan";

export interface RailsConfig {
  missingSections: {
    warnRatio: number;
    blockRatio: number;
    blockCount: number;
  };
  missingCourses: { warnRatio: number; blockRatio: number };
  sectionCountDrop: { blockRatio: number };
  detailFailures: { warnRatio: number; blockRatio: number };
  blockOnTruncatedSweep: boolean;
  blockOnSectionCourseMove: boolean;
  blockOnUnresolvedConfig: boolean;
}

export interface Violation {
  rule: string;
  severity: "warn" | "block";
  message: string;
  data?: Record<string, unknown>;
}

export interface CheckResult {
  ok: boolean;
  violations: Violation[];
  warnings: Violation[];
}

export interface CheckInput {
  plan: Plan;
  sweep: Pick<SweepResult, "sections" | "reportedTotal">;
  /** courses scraped this pass, and how many of them failed */
  detail: { tasks: number; failures: number };
  /** Banner part codes with no configured term row, whose sections were dropped */
  unknownParts: string[];
  rails: RailsConfig;
}

const UNRESOLVED_KINDS = new Set([
  "unknown-subject",
  "unknown-campus",
  "unknown-building",
]);

export function check(input: CheckInput): CheckResult {
  const { plan, sweep, detail, rails } = input;
  const found: Violation[] = [];

  const swept = sweep.sections.length;
  if (rails.blockOnTruncatedSweep && swept < sweep.reportedTotal) {
    found.push({
      rule: "truncated-sweep",
      severity: "block",
      message: `sweep read ${swept} of ${sweep.reportedTotal} reported sections`,
      data: { received: swept, reportedTotal: sweep.reportedTotal },
    });
  }

  found.push(
    ...ratioRule({
      rule: "missing-sections",
      count: plan.stats.missingSections,
      total: plan.stats.stateSections,
      warnRatio: rails.missingSections.warnRatio,
      blockRatio: rails.missingSections.blockRatio,
      blockCount: rails.missingSections.blockCount,
      noun: "section",
    }),
  );

  found.push(
    ...ratioRule({
      rule: "missing-courses",
      count: plan.stats.missingCourses,
      total: plan.stats.stateCourses,
      warnRatio: rails.missingCourses.warnRatio,
      blockRatio: rails.missingCourses.blockRatio,
      noun: "course",
    }),
  );

  // catches a sweep that ran against the wrong term entirely
  if (plan.stats.stateSections > 0) {
    const dropped = plan.stats.stateSections - plan.stats.snapshotSections;
    const ratio = dropped / plan.stats.stateSections;
    if (ratio > rails.sectionCountDrop.blockRatio) {
      found.push({
        rule: "section-count-drop",
        severity: "block",
        message: `term holds ${plan.stats.stateSections} sections but the sweep found ${plan.stats.snapshotSections}`,
        data: { dropped, ratio },
      });
    }
  }

  if (detail.tasks > 0) {
    const ratio = detail.failures / detail.tasks;
    if (ratio >= rails.detailFailures.blockRatio) {
      found.push({
        rule: "detail-failures",
        severity: "block",
        message: `${detail.failures} of ${detail.tasks} course scrapes failed`,
        data: { ratio },
      });
    } else if (ratio >= rails.detailFailures.warnRatio) {
      found.push({
        rule: "detail-failures",
        severity: "warn",
        message: `${detail.failures} of ${detail.tasks} course scrapes failed`,
        data: { ratio },
      });
    }
  }

  if (input.unknownParts.length > 0) {
    found.push({
      rule: "unknown-part",
      severity: "warn",
      message: `${input.unknownParts.length} part(s) of term are not configured and were discarded`,
      data: { parts: input.unknownParts },
    });
  }

  if (rails.blockOnSectionCourseMove) {
    const moved = problemsOfKind(plan.problems, "section-course-moved");
    if (moved.length > 0) {
      found.push({
        rule: "section-course-moved",
        severity: "block",
        message: `${moved.length} section(s) changed course`,
        data: { crns: moved.map((p) => p.key) },
      });
    }
  }

  if (rails.blockOnUnresolvedConfig) {
    const unresolved = plan.problems.filter((p) =>
      UNRESOLVED_KINDS.has(p.kind),
    );
    if (unresolved.length > 0) {
      found.push({
        rule: "unresolved-config",
        severity: "block",
        message: `${unresolved.length} reference(s) are missing from config`,
        data: {
          codes: [...new Set(unresolved.map((p) => `${p.entity}:${p.key}`))],
        },
      });
    }
  }

  const violations = found.filter((v) => v.severity === "block");
  return {
    ok: violations.length === 0,
    violations,
    warnings: found.filter((v) => v.severity === "warn"),
  };
}

function ratioRule(input: {
  rule: string;
  count: number;
  total: number;
  warnRatio: number;
  blockRatio: number;
  blockCount?: number;
  noun: string;
}): Violation[] {
  if (input.count === 0 || input.total === 0) return [];

  const ratio = input.count / input.total;
  const message = `${input.count} of ${input.total} ${input.noun}(s) are no longer listed`;
  const data = { count: input.count, total: input.total, ratio };

  if (
    ratio > input.blockRatio ||
    (input.blockCount !== undefined && input.count > input.blockCount)
  ) {
    return [{ rule: input.rule, severity: "block", message, data }];
  }

  if (ratio > input.warnRatio) {
    return [{ rule: input.rule, severity: "warn", message, data }];
  }

  return [];
}

function problemsOfKind(problems: PlanProblem[], kind: string): PlanProblem[] {
  return problems.filter((p) => p.kind === kind);
}
