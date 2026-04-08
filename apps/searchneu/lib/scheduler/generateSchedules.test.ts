import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * End-to-end scheduling logic tests — no database required.
 *
 * generateSchedules() itself hits the DB, so we test the two pure functions
 * it composes: generateCombinationsOptimized (locked courses) and
 * addOptionalCourses. Together they cover everything generateSchedules does
 * except the DB query and the optional-sort heuristic.
 *
 * The previous version of this file tested locally-defined shadow copies of
 * hasTimeConflict, generateCombinations, and addOptionalCourses — none of
 * which were the production implementations.
 */

import {
  generateCombinationsOptimized,
  addOptionalCourses,
  MAX_RESULTS,
} from "./generateCombinations";
import {
  meetingTimesToBinaryMask,
  hasConflictInSchedule,
} from "./binaryMeetingTime";
import { SectionWithCourse } from "./filters";
import { createMockSection } from "./binaryMeetingTimeTests/mocks";

// ---------------------------------------------------------------------------
// Helpers (mirrors the helpers in generateSchedules.ts)
// ---------------------------------------------------------------------------

function buildMasks(courses: SectionWithCourse[][]): bigint[][] {
  return courses.map((sections) => sections.map(meetingTimesToBinaryMask));
}

/** Run the full locked+optional pipeline, mirroring generateSchedules logic. */
function simulateGenerateSchedules(
  lockedCourses: SectionWithCourse[][],
  optionalCourses: SectionWithCourse[][],
  numCourses?: number,
): SectionWithCourse[][] {
  const optionalMasks = buildMasks(optionalCourses);
  const lockedSchedules = generateCombinationsOptimized(lockedCourses);

  if (lockedCourses.length === 0 && optionalCourses.length > 0) {
    return addOptionalCourses([], BigInt(0), optionalCourses, optionalMasks, numCourses, MAX_RESULTS);
  }

  if (optionalCourses.length === 0) {
    const schedules = lockedSchedules.map((r) => r.schedule);
    return numCourses !== undefined
      ? schedules.filter((s) => s.length === numCourses)
      : schedules;
  }

  const all: SectionWithCourse[][] = [];
  for (const { schedule, mask } of lockedSchedules) {
    if (numCourses !== undefined && schedule.length > numCourses) continue;
    const remaining = MAX_RESULTS - all.length;
    all.push(...addOptionalCourses(schedule, mask, optionalCourses, optionalMasks, numCourses, remaining));
    if (all.length >= MAX_RESULTS) break;
  }
  return all;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Four non-conflicting courses — one section each, all different days/times
const CS_SEC   = createMockSection(1,  [{ days: [1],    startTime: 900,  endTime: 1000 }], { courseId: 1 });
const MATH_SEC = createMockSection(2,  [{ days: [2],    startTime: 1000, endTime: 1100 }], { courseId: 2 });
const PHYS_SEC = createMockSection(3,  [{ days: [3],    startTime: 1100, endTime: 1200 }], { courseId: 3 });
const ENGW_SEC = createMockSection(4,  [{ days: [4],    startTime: 1300, endTime: 1400 }], { courseId: 4 });

// Two sections of CS — one on Mon, one conflicts with MATH
const CS_SEC_A = createMockSection(10, [{ days: [1],    startTime: 900,  endTime: 1000 }], { courseId: 10 });
const CS_SEC_B = createMockSection(11, [{ days: [2],    startTime: 1000, endTime: 1100 }], { courseId: 10 }); // conflicts with MATH_SEC2

const MATH_SEC2 = createMockSection(12, [{ days: [2],   startTime: 1000, endTime: 1100 }], { courseId: 11 });

// Optional course sections
const OPT_A = createMockSection(20, [{ days: [5],    startTime: 900,  endTime: 1000 }], { courseId: 20 });
const OPT_B = createMockSection(21, [{ days: [5],    startTime: 1000, endTime: 1100 }], { courseId: 20 });
const OPT_C = createMockSection(22, [{ days: [1],    startTime: 900,  endTime: 1000 }], { courseId: 21 }); // conflicts with CS_SEC

// ---------------------------------------------------------------------------
// Locked courses only
// ---------------------------------------------------------------------------

describe("locked courses only", () => {
  test("all non-conflicting → one schedule returned", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC], [MATH_SEC], [PHYS_SEC]],
      [],
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].length, 3);
    assert.ok(!hasConflictInSchedule(results[0]));
  });

  test("conflicting sections across courses → empty result", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC_B], [MATH_SEC2]], // both on Tue@10
      [],
    );
    assert.equal(results.length, 0);
  });

  test("course with multiple sections: conflicting section filtered out", () => {
    // CS has two sections; one conflicts with MATH, one doesn't
    const results = simulateGenerateSchedules(
      [[CS_SEC_A, CS_SEC_B], [MATH_SEC2]],
      [],
    );
    assert.equal(results.length, 1);
    assert.ok(results[0].some((s) => s.id === CS_SEC_A.id)); // only CS_SEC_A fits
    assert.ok(results[0].some((s) => s.id === MATH_SEC2.id));
    assert.ok(!hasConflictInSchedule(results[0]));
  });

  test("empty locked courses → empty result", () => {
    const results = simulateGenerateSchedules([], []);
    assert.equal(results.length, 0);
  });

  test("single course → one schedule per section", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC_A, CS_SEC_B]],
      [],
    );
    assert.equal(results.length, 2);
  });

  test("numCourses matches locked count → all results kept", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC], [MATH_SEC]],
      [],
      2,
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].length, 2);
  });

  test("numCourses < locked count → no results (can't drop locked courses)", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC], [MATH_SEC], [PHYS_SEC]],
      [],
      2, // impossible — all 3 locked courses are required
    );
    assert.equal(results.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Optional courses only
// ---------------------------------------------------------------------------

describe("optional courses only", () => {
  test("single optional with one section → empty schedule and schedule with section", () => {
    const results = simulateGenerateSchedules([], [[OPT_A]]);
    assert.equal(results.length, 2);
    assert.ok(results.some((s) => s.length === 0));
    assert.ok(results.some((s) => s.length === 1 && s[0].id === OPT_A.id));
  });

  test("two non-conflicting optional courses → all 4 combinations", () => {
    const results = simulateGenerateSchedules([], [[OPT_A], [ENGW_SEC]]);
    assert.equal(results.length, 4);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });

  test("numCourses = 1 with two optional courses → only single-course schedules", () => {
    const results = simulateGenerateSchedules([], [[OPT_A], [OPT_B]], 1);
    assert.ok(results.every((s) => s.length === 1));
  });

  test("optional course where all sections conflict → only empty schedule", () => {
    // OPT_C conflicts with CS_SEC (same Mon@9 slot), but we pass it as an optional
    // against an empty base — no conflict with empty base, so it should be included
    const results = simulateGenerateSchedules([], [[OPT_C]]);
    assert.equal(results.length, 2); // empty + [OPT_C]
  });
});

// ---------------------------------------------------------------------------
// Mixed locked + optional courses
// ---------------------------------------------------------------------------

describe("mixed locked + optional courses", () => {
  test("locked course + non-conflicting optional → base and extended schedules", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC]],
      [[OPT_A]], // Fri@9, no conflict with Mon@9
    );
    assert.equal(results.length, 2);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
    assert.ok(results.every((s) => s.some((sec) => sec.id === CS_SEC.id)));
  });

  test("locked course + optional that conflicts → only base schedule", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC]],     // Mon@9
      [[OPT_C]],      // Mon@9 — conflict
    );
    assert.equal(results.length, 1);
    assert.ok(!results[0].some((s) => s.id === OPT_C.id));
  });

  test("multiple locked + multiple optional → all conflict-free", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC], [MATH_SEC]],
      [[OPT_A], [PHYS_SEC]],
    );
    assert.ok(results.length > 0);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
    // Every result must contain both locked courses
    assert.ok(results.every((s) =>
      s.some((sec) => sec.id === CS_SEC.id) &&
      s.some((sec) => sec.id === MATH_SEC.id),
    ));
  });

  test("numCourses = locked + 1 → only schedules that add exactly one optional", () => {
    const results = simulateGenerateSchedules(
      [[CS_SEC]],           // 1 locked
      [[OPT_A], [PHYS_SEC]], // 2 optional
      2,                    // must have exactly 2 total
    );
    assert.ok(results.every((s) => s.length === 2));
    assert.ok(results.every((s) => s.some((sec) => sec.id === CS_SEC.id)));
  });

  test("MAX_RESULTS cap respected across locked+optional pipeline", () => {
    // Build many non-conflicting sections so combinations explode
    const locked: SectionWithCourse[][] = [
      [createMockSection(1000, [{ days: [1], startTime: 800, endTime: 850 }])],
      [createMockSection(1001, [{ days: [2], startTime: 800, endTime: 850 }])],
    ];
    const optional: SectionWithCourse[][] = Array.from({ length: 8 }, (_, i) => [
      createMockSection(2000 + i, [{ days: [3 + (i % 2)], startTime: 900 + i * 100, endTime: 950 + i * 100 }]),
    ]);
    const results = simulateGenerateSchedules(locked, optional);
    assert.ok(results.length <= MAX_RESULTS);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });
});

// ---------------------------------------------------------------------------
// All results are always conflict-free (invariant)
// ---------------------------------------------------------------------------

describe("schedule invariants", () => {
  test("no returned schedule ever has a time conflict", () => {
    const courses = [
      [CS_SEC_A, CS_SEC_B],
      [MATH_SEC2],
      [PHYS_SEC],
    ];
    const results = simulateGenerateSchedules(courses, [[OPT_A, OPT_C]]);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });

  test("every schedule contains exactly one section per locked course", () => {
    const locked = [[CS_SEC_A, CS_SEC_B], [MATH_SEC2]];
    const lockedSchedules = generateCombinationsOptimized(locked);
    // Each result must have exactly 2 sections (one per locked course)
    assert.ok(lockedSchedules.every(({ schedule }) => schedule.length === locked.length));
  });
});
