import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { check, type RailsConfig } from "./check";
import type { Plan, PlanProblem, PlanStats } from "./plan";
import { RAILS } from "../config";

const rails: RailsConfig = RAILS;

function planWith(
  stats: Partial<PlanStats> = {},
  problems: PlanProblem[] = [],
): Plan {
  return {
    term: "202610",
    pass: "deep",
    parts: [],
    problems,
    stats: {
      courseInserts: 0,
      courseUpdates: 0,
      sectionInserts: 0,
      sectionUpdates: 0,
      meetingTimeInserts: 0,
      meetingTimeDeletes: 0,
      missingCourses: 0,
      missingSections: 0,
      tombstoned: 0,
      restored: 0,
      snapshotSections: 1000,
      stateSections: 1000,
      stateCourses: 500,
      ...stats,
    },
  };
}

function run(
  plan: Plan,
  overrides: {
    sweep?: { sections: { length: number }[]; reportedTotal: number };
    detail?: { tasks: number; failures: number };
    unknownParts?: string[];
  } = {},
) {
  return check({
    plan,
    sweep: {
      sections: new Array(plan.stats.snapshotSections).fill(null),
      reportedTotal: plan.stats.snapshotSections,
      ...overrides.sweep,
    } as never,
    detail: overrides.detail ?? { tasks: 0, failures: 0 },
    unknownParts: overrides.unknownParts ?? [],
    rails,
  });
}

describe("check", () => {
  test("blocks a sweep that came back short", () => {
    const result = run(planWith(), {
      sweep: { sections: new Array(900).fill(null), reportedTotal: 1000 },
    });

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.violations.map((v) => v.rule),
      ["truncated-sweep"],
    );
  });

  describe("missing sections", () => {
    test("tolerates ordinary churn", () => {
      const result = run(planWith({ missingSections: 10 }));

      assert.equal(result.ok, true);
      assert.deepEqual(result.warnings, []);
    });

    test("warns past the warn ratio", () => {
      const result = run(planWith({ missingSections: 30 }));

      assert.equal(result.ok, true);
      assert.deepEqual(
        result.warnings.map((v) => v.rule),
        ["missing-sections"],
      );
    });

    test("blocks past the block ratio", () => {
      const result = run(planWith({ missingSections: 200 }));

      assert.equal(result.ok, false);
      assert.deepEqual(
        result.violations.map((v) => v.rule),
        ["missing-sections"],
      );
    });

    test("blocks past the absolute count even in a huge term", () => {
      const result = run(
        planWith({
          missingSections: 600,
          stateSections: 20000,
          snapshotSections: 20000,
        }),
      );

      assert.equal(result.ok, false);
      assert.deepEqual(
        result.violations.map((v) => v.rule),
        ["missing-sections"],
      );
    });
  });

  describe("missing courses", () => {
    test("blocks past the block ratio", () => {
      const result = run(planWith({ missingCourses: 50 }));

      assert.equal(result.ok, false);
      assert.deepEqual(
        result.violations.map((v) => v.rule),
        ["missing-courses"],
      );
    });
  });

  test("blocks a term that lost a tenth of its sections", () => {
    const result = run(
      planWith({ stateSections: 1000, snapshotSections: 850 }),
      { sweep: { sections: new Array(850).fill(null), reportedTotal: 850 } },
    );

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.violations.map((v) => v.rule),
      ["section-count-drop"],
    );
  });

  describe("detail failures", () => {
    test("warns at a handful", () => {
      const result = run(planWith(), { detail: { tasks: 100, failures: 8 } });

      assert.equal(result.ok, true);
      assert.deepEqual(
        result.warnings.map((v) => v.rule),
        ["detail-failures"],
      );
    });

    test("blocks when Banner is clearly unwell", () => {
      const result = run(planWith(), { detail: { tasks: 100, failures: 40 } });

      assert.equal(result.ok, false);
      assert.deepEqual(
        result.violations.map((v) => v.rule),
        ["detail-failures"],
      );
    });
  });

  test("blocks any section that changed course", () => {
    const result = run(
      planWith({}, [
        {
          kind: "section-course-moved",
          entity: "section",
          key: "70001",
        },
      ]),
    );

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.violations.map((v) => v.rule),
      ["section-course-moved"],
    );
  });

  test("blocks on config that cannot be resolved", () => {
    const result = run(
      planWith({}, [
        { kind: "unknown-subject", entity: "subject", key: "ZZ" },
        { kind: "unknown-building", entity: "building", key: "QQ" },
      ]),
    );

    assert.equal(result.ok, false);
    const [violation] = result.violations;
    assert.equal(violation.rule, "unresolved-config");
    assert.deepEqual(violation.data?.codes, ["subject:ZZ", "building:QQ"]);
  });

  test("warns about a discarded part without blocking the pass", () => {
    // an unconfigured part is thrown out, which is not a reason to refuse
    // every other part's writes
    const result = run(planWith(), { unknownParts: ["2C"] });

    assert.equal(result.ok, true);
    assert.deepEqual(
      result.warnings.map((v) => v.rule),
      ["unknown-part"],
    );
    assert.deepEqual(result.warnings[0].data?.parts, ["2C"]);
  });
});
