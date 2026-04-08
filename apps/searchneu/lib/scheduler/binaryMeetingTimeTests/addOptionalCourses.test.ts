import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { SectionWithCourse } from "../filters";
import {
  addOptionalCourses,
  generateCombinationsOptimized,
  MAX_RESULTS,
} from "../generateCombinations";
import { meetingTimesToBinaryMask, hasConflictInSchedule } from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build pre-computed masks for a list of courses, matching the shape expected by addOptionalCourses. */
function buildMasks(sectionsByCourse: SectionWithCourse[][]): bigint[][] {
  return sectionsByCourse.map((sections) =>
    sections.map(meetingTimesToBinaryMask),
  );
}

/** Combined mask for an array of sections (OR of all individual masks). */
function combinedMask(sections: SectionWithCourse[]): bigint {
  return sections.reduce(
    (acc, s) => acc | meetingTimesToBinaryMask(s),
    BigInt(0),
  );
}

/** Extract sorted section-ID sets from a list of schedules for order-independent comparison. */
function toIdSets(schedules: SectionWithCourse[][]): Set<number>[] {
  return schedules.map((s) => new Set(s.map((sec) => sec.id)));
}

// ---------------------------------------------------------------------------
// Fixtures — non-conflicting time slots
// ---------------------------------------------------------------------------

const S_MON_8    = createMockSection(1,  [{ days: [1],    startTime: 800,  endTime: 900  }]);
const S_MON_10   = createMockSection(2,  [{ days: [1],    startTime: 1000, endTime: 1100 }]);
const S_MON_12   = createMockSection(3,  [{ days: [1],    startTime: 1200, endTime: 1300 }]);
const S_TUE_8    = createMockSection(4,  [{ days: [2],    startTime: 800,  endTime: 900  }]);
const S_TUE_10   = createMockSection(5,  [{ days: [2],    startTime: 1000, endTime: 1100 }]);
const S_WED_8    = createMockSection(6,  [{ days: [3],    startTime: 800,  endTime: 900  }]);
const S_WED_10   = createMockSection(7,  [{ days: [3],    startTime: 1000, endTime: 1100 }]);
// Conflicts with S_MON_8 (same day/time)
const S_MON_8_B  = createMockSection(8,  [{ days: [1],    startTime: 800,  endTime: 900  }]);
// Multi-meeting: MWF lecture + TR lab
const S_MWF_LECTURE_TR_LAB = createMockSection(9, [
  { days: [1, 3, 5], startTime: 900,  endTime: 950  }, // MWF 9-9:50
  { days: [2, 4],    startTime: 1100, endTime: 1150 }, // TR 11-11:50
]);
// Conflicts with lecture block
const S_MON_OVERLAP_LECTURE = createMockSection(10, [
  { days: [1], startTime: 930, endTime: 1030 },
]);
// Conflicts with lab block only
const S_TUE_OVERLAP_LAB = createMockSection(11, [
  { days: [2], startTime: 1130, endTime: 1230 },
]);
// Doesn't conflict with either block
const S_MON_BEFORE = createMockSection(12, [
  { days: [1], startTime: 800, endTime: 850 },
]);

// ---------------------------------------------------------------------------
// Basic correctness
// ---------------------------------------------------------------------------

describe("addOptionalCourses — basic correctness", () => {
  test("no optional courses → returns exactly the base schedule", () => {
    const base = [S_MON_8];
    const mask = combinedMask(base);
    const results = addOptionalCourses(base, mask, [], []);
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], base);
  });

  test("one optional course, no conflict → returns [base] and [base + optional]", () => {
    const base = [S_MON_8];
    const optionals = [[S_TUE_10]];
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 2);
    const idSets = toIdSets(results);
    assert.ok(idSets.some((s) => s.size === 1 && s.has(S_MON_8.id)));
    assert.ok(idSets.some((s) => s.size === 2 && s.has(S_MON_8.id) && s.has(S_TUE_10.id)));
  });

  test("one optional course, always conflicts → returns only base schedule", () => {
    const base = [S_MON_8];
    const optionals = [[S_MON_8_B]]; // same slot as base
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], base);
  });

  test("two independent optional courses, no conflicts → 4 results (2×2)", () => {
    const base = [S_MON_8];
    const optionals = [[S_TUE_10], [S_WED_8]];
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 4);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });

  test("empty base schedule with optional courses works correctly", () => {
    const optionals = [[S_MON_8, S_MON_10], [S_TUE_8]];
    const results = addOptionalCourses(
      [],
      BigInt(0),
      optionals,
      buildMasks(optionals),
    );
    // skip/skip, MON_8/skip, MON_10/skip, skip/TUE_8, MON_8/TUE_8, MON_10/TUE_8 = 6
    assert.equal(results.length, 6);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });

  test("optional section that conflicts with another optional is excluded", () => {
    // Both optional sections occupy MON@8 — can't pick both
    const optionals = [[S_MON_8], [S_MON_8_B]];
    const results = addOptionalCourses(
      [],
      BigInt(0),
      optionals,
      buildMasks(optionals),
    );
    const idSets = toIdSets(results);
    // Must not contain both S_MON_8 and S_MON_8_B in the same schedule
    assert.ok(!idSets.some((s) => s.has(S_MON_8.id) && s.has(S_MON_8_B.id)));
  });

  test("no output schedules contain time conflicts", () => {
    const base = [S_MON_8, S_TUE_8];
    const optionals = [[S_MON_10, S_MON_8_B], [S_WED_10, S_WED_8]];
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.ok(results.length > 0);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });
});

// ---------------------------------------------------------------------------
// Sections with multiple meeting times (lecture + lab)
// ---------------------------------------------------------------------------

describe("addOptionalCourses — multiple meeting times per section", () => {
  test("section with MWF+TR meetings: overlapping optional on Mon is excluded", () => {
    const base = [S_MWF_LECTURE_TR_LAB];
    const optionals = [[S_MON_OVERLAP_LECTURE]];
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    // Only the base-only schedule; overlap with lecture block on Mon
    assert.equal(results.length, 1);
    assert.ok(!results[0].includes(S_MON_OVERLAP_LECTURE));
  });

  test("section with MWF+TR meetings: overlapping optional on Tue (lab) is excluded", () => {
    const base = [S_MWF_LECTURE_TR_LAB];
    const optionals = [[S_TUE_OVERLAP_LAB]];
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 1);
    assert.ok(!results[0].includes(S_TUE_OVERLAP_LAB));
  });

  test("section with MWF+TR meetings: non-overlapping optional is included", () => {
    const base = [S_MWF_LECTURE_TR_LAB];
    const optionals = [[S_MON_BEFORE]]; // Mon 8-8:50, lecture starts at 9
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 2);
    const withOptional = results.find((s) => s.includes(S_MON_BEFORE));
    assert.ok(withOptional !== undefined);
    assert.ok(!hasConflictInSchedule(withOptional));
  });

  test("optional course with multiple meeting times: all blocks checked for conflicts", () => {
    // S_MWF_LECTURE_TR_LAB occupies MWF@9 and TR@11. The optional below occupies MWF@9 too.
    const conflictingMulti = createMockSection(20, [
      { days: [1, 3, 5], startTime: 900, endTime: 950 }, // conflicts with lecture
      { days: [6],        startTime: 800, endTime: 900 }, // Saturday — no conflict
    ]);
    const optionals = [[conflictingMulti]];
    const results = addOptionalCourses(
      [S_MWF_LECTURE_TR_LAB],
      combinedMask([S_MWF_LECTURE_TR_LAB]),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 1);
    assert.ok(!results[0].includes(conflictingMulti));
  });
});

// ---------------------------------------------------------------------------
// numCourses parameter
// ---------------------------------------------------------------------------

describe("addOptionalCourses — numCourses filtering", () => {
  // base has 1 section, 2 optional courses → without numCourses: 4 results (1, 1+A, 1+B, 1+A+B)
  const base = [S_MON_8];
  const optionals = [[S_TUE_10], [S_WED_8]];

  test("numCourses = base length → only the base schedule", () => {
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      1, // numCourses = 1, base already has 1
    );
    assert.equal(results.length, 1);
    assert.deepEqual(results[0].map((s) => s.id), [S_MON_8.id]);
  });

  test("numCourses = base + 1 → only schedules with exactly one optional added", () => {
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      2,
    );
    assert.equal(results.length, 2);
    assert.ok(results.every((s) => s.length === 2));
  });

  test("numCourses = base + 2 → only schedules with both optionals added", () => {
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      3,
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].length, 3);
  });

  test("numCourses met mid-recursion: shortcut skips remaining optional courses", () => {
    // base = 1 section, numCourses = 2, THREE optional courses.
    // After adding the first optional the target is reached. The shortcut at
    // `currentSchedule.length === numCourses` must jump straight to the base
    // case (which does the push) rather than continuing into the remaining two
    // optional courses.  If the shortcut were broken we'd get wrong counts or
    // missing/duplicate results.
    const base = [S_MON_8];
    const optionals = [[S_TUE_10], [S_WED_8], [S_MON_12]]; // 3 optional courses
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      2,
    );
    // Exactly three length-2 results: base + each individual optional
    assert.equal(results.length, 3);
    assert.ok(results.every((s) => s.length === 2));
    const idSets = toIdSets(results);
    assert.ok(idSets.some((s) => s.has(S_MON_8.id) && s.has(S_TUE_10.id)));
    assert.ok(idSets.some((s) => s.has(S_MON_8.id) && s.has(S_WED_8.id)));
    assert.ok(idSets.some((s) => s.has(S_MON_8.id) && s.has(S_MON_12.id)));
  });

  test("numCourses impossible to reach → no results", () => {
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      10, // impossible: only 3 sections total
    );
    assert.equal(results.length, 0);
  });

  test("numCourses undefined → all valid combinations returned", () => {
    const results = addOptionalCourses(
      base,
      combinedMask(base),
      optionals,
      buildMasks(optionals),
      undefined,
    );
    assert.equal(results.length, 4);
  });
});

// ---------------------------------------------------------------------------
// maxResults cap
// ---------------------------------------------------------------------------

describe("addOptionalCourses — maxResults cap", () => {
  test("respects maxResults = 1", () => {
    const optionals = [[S_MON_8], [S_TUE_8], [S_WED_8]];
    const results = addOptionalCourses([], BigInt(0), optionals, buildMasks(optionals), undefined, 1);
    assert.equal(results.length, 1);
  });

  test("respects maxResults when there are many valid combos", () => {
    // 4 independent optional courses → 2^4 = 16 combos; cap at 5
    const optionals = [
      [S_MON_8],
      [S_TUE_8],
      [S_WED_8],
      [createMockSection(50, [{ days: [4], startTime: 800, endTime: 900 }])],
    ];
    const results = addOptionalCourses([], BigInt(0), optionals, buildMasks(optionals), undefined, 5);
    assert.equal(results.length, 5);
  });

  test("maxResults larger than total results → returns all", () => {
    const optionals = [[S_MON_10], [S_WED_10]];
    const uncapped = addOptionalCourses([], BigInt(0), optionals, buildMasks(optionals));
    const capped   = addOptionalCourses([], BigInt(0), optionals, buildMasks(optionals), undefined, 100);
    assert.equal(capped.length, uncapped.length);
  });
});

// ---------------------------------------------------------------------------
// Push/pop correctness — schedules must be independent snapshots
// ---------------------------------------------------------------------------

describe("addOptionalCourses — push/pop isolation", () => {
  test("returned schedules are independent copies (mutating one doesn't affect others)", () => {
    const optionals = [[S_TUE_10], [S_WED_8]];
    const results = addOptionalCourses(
      [S_MON_8],
      combinedMask([S_MON_8]),
      optionals,
      buildMasks(optionals),
    );
    assert.equal(results.length, 4);
    // Mutate the first result
    results[0].push(S_MON_12);
    // Other results must not be affected
    assert.ok(results.slice(1).every((s) => !s.includes(S_MON_12)));
  });

  test("base schedule array is not mutated by the call", () => {
    const base = [S_MON_8];
    const optionals = [[S_TUE_10]];
    addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    assert.equal(base.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Integration: generateCombinationsOptimized + addOptionalCourses
// (simulates what generateSchedules does, without the DB layer)
// ---------------------------------------------------------------------------

describe("locked + optional courses integration", () => {
  test("locked courses generate valid base schedules, each extended with optionals", () => {
    // Two locked courses, each with 2 sections
    const lockedCourseA = [S_MON_8,  S_MON_10]; // A sections
    const lockedCourseB = [S_TUE_8,  S_WED_8];  // B sections (all non-conflicting with A)
    const lockedSchedules = generateCombinationsOptimized([lockedCourseA, lockedCourseB]);

    const optionals = [[S_WED_10, S_MON_12]];
    const optMasks  = buildMasks(optionals);

    const all: SectionWithCourse[][] = [];
    for (const { schedule, mask } of lockedSchedules) {
      const extended = addOptionalCourses(schedule, mask, optionals, optMasks);
      all.push(...extended);
    }

    // All results must be conflict-free
    assert.ok(all.length > 0);
    assert.ok(all.every((s) => !hasConflictInSchedule(s)));
    // Every result must contain both locked sections
    assert.ok(all.every((s) =>
      lockedCourseA.some((a) => s.includes(a)) &&
      lockedCourseB.some((b) => s.includes(b)),
    ));
  });

  test("MAX_RESULTS is respected across the combined locked+optional loop", () => {
    const lockedCourses = [
      [S_MON_8, S_MON_10],
      [S_TUE_8, S_TUE_10],
    ];
    const lockedSchedules = generateCombinationsOptimized(lockedCourses);
    const optionals = [[S_WED_8, S_WED_10]];
    const optMasks  = buildMasks(optionals);

    const all: SectionWithCourse[][] = [];
    for (const { schedule, mask } of lockedSchedules) {
      if (all.length >= MAX_RESULTS) break;
      const remaining = MAX_RESULTS - all.length;
      all.push(...addOptionalCourses(schedule, mask, optionals, optMasks, undefined, remaining));
    }

    assert.ok(all.length <= MAX_RESULTS);
    assert.ok(all.every((s) => !hasConflictInSchedule(s)));
  });

  test("numCourses filters correctly across locked + optional pipeline", () => {
    const lockedCourses = [[S_MON_8]];
    const lockedSchedules = generateCombinationsOptimized(lockedCourses);
    const optionals = [[S_TUE_8], [S_WED_8]];
    const optMasks  = buildMasks(optionals);

    // numCourses = 2 → only schedules with exactly 1 optional added
    const results: SectionWithCourse[][] = [];
    for (const { schedule, mask } of lockedSchedules) {
      results.push(...addOptionalCourses(schedule, mask, optionals, optMasks, 2));
    }

    assert.ok(results.every((s) => s.length === 2));
  });
});

// ---------------------------------------------------------------------------
// Edge: optional course with empty sections list
// ---------------------------------------------------------------------------

describe("addOptionalCourses — optional course with no sections", () => {
  test("empty optional course is silently skipped (no crash)", () => {
    const base = [S_MON_8];
    const optionals: SectionWithCourse[][] = [[]]; // one optional course, zero sections
    const results = addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    // The only choice for the empty course is skip → returns [base]
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], base);
  });

  test("empty optional among non-empty optionals", () => {
    const base = [S_MON_8];
    const optionals: SectionWithCourse[][] = [[], [S_TUE_10]];
    const results = addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    // Empty course: skip only. TUE_10 course: skip or include → 2 results
    assert.equal(results.length, 2);
    assert.ok(results.every((s) => !hasConflictInSchedule(s)));
  });
});

// ---------------------------------------------------------------------------
// Exact result verification for deterministic small cases
// ---------------------------------------------------------------------------

describe("addOptionalCourses — exact result IDs", () => {
  test("base + one optional: exact section IDs in each result", () => {
    const base = [S_MON_8];
    const optionals = [[S_TUE_10]];
    const results = addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    const idSets = toIdSets(results);
    // Result 1: just base
    assert.ok(idSets.some((s) => s.size === 1 && s.has(S_MON_8.id)));
    // Result 2: base + TUE_10
    assert.ok(idSets.some((s) => s.size === 2 && s.has(S_MON_8.id) && s.has(S_TUE_10.id)));
  });

  test("one optional with two sections: only the non-conflicting section appears", () => {
    const base = [S_MON_8];
    // S_MON_8_B conflicts with base; S_TUE_10 does not
    const optionals = [[S_MON_8_B, S_TUE_10]];
    const results = addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    const idSets = toIdSets(results);
    // No result should contain S_MON_8_B
    assert.ok(idSets.every((s) => !s.has(S_MON_8_B.id)));
    // One result should contain S_TUE_10
    assert.ok(idSets.some((s) => s.has(S_TUE_10.id)));
  });

  test("two optionals: all 4 exact combinations present", () => {
    const base = [S_MON_8];
    const optionals = [[S_TUE_10], [S_WED_8]];
    const results = addOptionalCourses(base, combinedMask(base), optionals, buildMasks(optionals));
    const idSets = toIdSets(results);
    assert.equal(idSets.length, 4);
    // Exact 4 combinations
    const has = (ids: number[]) => idSets.some((s) => s.size === ids.length && ids.every((id) => s.has(id)));
    assert.ok(has([S_MON_8.id]));
    assert.ok(has([S_MON_8.id, S_TUE_10.id]));
    assert.ok(has([S_MON_8.id, S_WED_8.id]));
    assert.ok(has([S_MON_8.id, S_TUE_10.id, S_WED_8.id]));
  });
});

// ---------------------------------------------------------------------------
// Correctness comparison — capped results must be a valid subset
// ---------------------------------------------------------------------------

describe("generateCombinationsOptimized — capped results are a valid subset", () => {
  test("every schedule in the capped result also appears in the uncapped result", () => {
    // Small enough that uncapped is tractable
    const sectionsByCourse = [
      [S_MON_8,  S_MON_10, S_MON_12],
      [S_TUE_8,  S_TUE_10],
      [S_WED_8,  S_WED_10],
    ];

    const uncapped = generateCombinationsOptimized(sectionsByCourse);
    const capped   = generateCombinationsOptimized(sectionsByCourse, 3);

    assert.ok(capped.length <= 3);
    assert.ok(capped.length <= uncapped.length);

    const uncappedIdSets = toIdSets(uncapped.map((r) => r.schedule));

    for (const { schedule } of capped) {
      const ids = new Set(schedule.map((s) => s.id));
      const found = uncappedIdSets.some((u) => {
        if (u.size !== ids.size) return false;
        for (const id of ids) if (!u.has(id)) return false;
        return true;
      });
      assert.ok(found, `capped schedule [${[...ids]}] not found in uncapped results`);
    }
  });

  test("every result is conflict-free regardless of cap", () => {
    const sectionsByCourse = [
      [S_MON_8, S_MON_10, S_TUE_8],
      [S_WED_8, S_WED_10],
    ];
    const results = generateCombinationsOptimized(sectionsByCourse, 5);
    assert.ok(results.every(({ schedule }) => !hasConflictInSchedule(schedule)));
  });
});
