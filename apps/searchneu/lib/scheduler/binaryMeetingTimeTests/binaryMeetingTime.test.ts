import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { SectionWithCourse } from "../filters";
import {
  generateCombinationsOptimized,
  MAX_RESULTS,
  incrementIndex,
} from "../generateCombinations";
import {
  hasConflictInSchedule,
  meetingTimesToBinaryMask,
  masksConflict,
} from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

const TIME_SLOTS = [
  { startTime: 800, endTime: 915 },
  { startTime: 930, endTime: 1045 },
  { startTime: 1100, endTime: 1215 },
  { startTime: 1300, endTime: 1415 },
  { startTime: 1430, endTime: 1545 },
  { startTime: 1600, endTime: 1715 },
  { startTime: 1730, endTime: 1845 },
  { startTime: 1900, endTime: 2015 },
];

const DAY_PATTERNS = [
  [1, 3, 5], // MWF
  [2, 4], // TR
  [1, 3], // MW
  [2, 4], // TR
  [1], // M only
  [5], // F only
];

const SUBJECTS = ["CS", "MATH", "PHYS", "ECON", "ENGW", "BIOL", "CHEM", "PSYC"];
const NUMBERS = [
  "1000",
  "2000",
  "3000",
  "4000",
  "1500",
  "2500",
  "3500",
  "4500",
];

function buildSectionsByCourse(
  numCourses: number,
  sectionsPerCourse: number,
): SectionWithCourse[][] {
  const sectionsByCourse: SectionWithCourse[][] = [];
  for (let c = 0; c < numCourses; c++) {
    const courseId = c + 1;
    const sections: SectionWithCourse[] = [];
    for (let i = 0; i < sectionsPerCourse; i++) {
      const slot = TIME_SLOTS[i % TIME_SLOTS.length];
      const days = DAY_PATTERNS[i % DAY_PATTERNS.length];
      sections.push(
        createMockSection(
          courseId * 1000 + i,
          [{ days, startTime: slot.startTime, endTime: slot.endTime }],
          {
            courseId,
            courseSubject: SUBJECTS[c % SUBJECTS.length],
            courseNumber: NUMBERS[c % NUMBERS.length],
          },
        ),
      );
    }
    sectionsByCourse.push(sections);
  }
  return sectionsByCourse;
}

function generateCombinationsOriginal(
  sectionsByCourse: SectionWithCourse[][],
  maxResults?: number,
): SectionWithCourse[][] {
  if (sectionsByCourse.length === 0) return [];
  if (sectionsByCourse.length === 1)
    return sectionsByCourse[0].map((section) => [section]);

  const sortedIndices = sectionsByCourse
    .map((sections, idx) => ({ sections, idx, count: sections.length }))
    .sort((a, b) => a.count - b.count);

  const sortedSections = sortedIndices.map((item) => item.sections);
  const result: SectionWithCourse[][] = [];
  const sizes = sortedSections.map((s) => s.length);
  const indexes = new Array(sizes.length).fill(0);

  const sectionMasks: bigint[][] = sortedSections.map((sections) =>
    sections.map(meetingTimesToBinaryMask),
  );

  while (true) {
    if (maxResults !== undefined && result.length >= maxResults) break;

    const combination: SectionWithCourse[] = [];
    const combinationMasks: bigint[] = [];
    let conflictIndex = -1;

    for (let i = 0; i < indexes.length; i++) {
      const section = sortedSections[i][indexes[i]];
      const mask = sectionMasks[i][indexes[i]];

      for (let j = 0; j < combinationMasks.length; j++) {
        if (masksConflict(combinationMasks[j], mask)) {
          conflictIndex = i;
          break;
        }
      }

      if (conflictIndex !== -1) break;

      combination.push(section);
      combinationMasks.push(mask);
    }

    if (conflictIndex === -1) {
      result.push(combination);
      if (incrementIndex(indexes, sizes, sizes.length - 1)) break;
    } else {
      if (incrementIndex(indexes, sizes, conflictIndex)) break;
    }
  }

  return result;
}

// Test suite for hasConflictInSchedule function
describe("hasConflictInSchedule", () => {
  // helper function to create a schedule from mock sections
  const schedule = (...sections: ReturnType<typeof createMockSection>[]) =>
    sections;

  test("returns false when sections are on different days", () => {
    const sectionA = createMockSection(1, [
      { days: [1, 3, 5], startTime: 930, endTime: 1045 },
    ]);
    const sectionB = createMockSection(2, [
      { days: [2, 4], startTime: 930, endTime: 1045 },
    ]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), false);
  });

  test("detects complete overlap on same day", () => {
    const sectionA = createMockSection(1, [
      { days: [1], startTime: 900, endTime: 1100 },
    ]);
    const sectionB = createMockSection(2, [
      { days: [1], startTime: 900, endTime: 1100 },
    ]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), true);
  });

  test("detects partial overlap on same day", () => {
    const sectionA = createMockSection(1, [
      { days: [2], startTime: 930, endTime: 1045 },
    ]);
    const sectionB = createMockSection(2, [
      { days: [2], startTime: 1000, endTime: 1115 },
    ]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), true);
  });

  test("no conflict when meetings are back-to-back", () => {
    const sectionA = createMockSection(1, [
      { days: [3], startTime: 900, endTime: 1000 },
    ]);
    const sectionB = createMockSection(2, [
      { days: [3], startTime: 1000, endTime: 1100 },
    ]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), false);
  });

  test("detects conflict across multiple sections", () => {
    const sectionA = createMockSection(1, [
      { days: [4], startTime: 800, endTime: 915 },
    ]);
    const sectionB = createMockSection(2, [
      { days: [4], startTime: 930, endTime: 1045 },
    ]);
    const sectionC = createMockSection(3, [
      { days: [4], startTime: 900, endTime: 945 },
    ]);

    assert.equal(
      hasConflictInSchedule(schedule(sectionA, sectionB, sectionC)),
      true,
    );
  });

  test("handles sections with multiple meeting blocks", () => {
    const sectionA = createMockSection(1, [
      { days: [1, 3], startTime: 900, endTime: 950 },
      { days: [5], startTime: 1400, endTime: 1530 },
    ]);

    const sectionB = createMockSection(2, [
      { days: [2, 4], startTime: 900, endTime: 950 },
      { days: [5], startTime: 1600, endTime: 1730 },
    ]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), false);
  });

  test("sections with no meeting times never conflict", () => {
    const emptySectionA = createMockSection(7, []);
    const emptySectionB = createMockSection(8, []);

    assert.equal(
      hasConflictInSchedule(schedule(emptySectionA, emptySectionB)),
      false,
    );

    const mixedSection = createMockSection(9, [
      { days: [1], startTime: 900, endTime: 950 },
    ]);
    assert.equal(
      hasConflictInSchedule(schedule(emptySectionA, mixedSection)),
      false,
    );
  });

  test("meeting blocks spanning multiple days still detect conflicts", () => {
    const multiDay = createMockSection(10, [
      { days: [1, 3], startTime: 900, endTime: 950 },
    ]);
    const overlapMonday = createMockSection(11, [
      { days: [1], startTime: 930, endTime: 1000 },
    ]);
    const overlapWednesday = createMockSection(12, [
      { days: [3], startTime: 915, endTime: 945 },
    ]);

    assert.equal(
      hasConflictInSchedule(schedule(multiDay, overlapMonday)),
      true,
    );
    assert.equal(
      hasConflictInSchedule(schedule(multiDay, overlapWednesday)),
      true,
    );
  });

  test("supports meeting times not aligned to 30-minute increments", () => {
    const sectionWithOddEnd = createMockSection(13, [
      { days: [2], startTime: 900, endTime: 1005 },
    ]);
    const overlappingSection = createMockSection(14, [
      { days: [2], startTime: 1000, endTime: 1100 },
    ]);
    const nonOverlappingSection = createMockSection(15, [
      { days: [2], startTime: 1010, endTime: 1100 },
    ]);

    assert.equal(
      hasConflictInSchedule(schedule(sectionWithOddEnd, overlappingSection)),
      true,
    );
    assert.equal(
      hasConflictInSchedule(schedule(sectionWithOddEnd, nonOverlappingSection)),
      false,
    );
  });

  test("handles weekend meeting times", () => {
    const saturdayClass = createMockSection(16, [
      { days: [6], startTime: 900, endTime: 1030 },
    ]);
    const sundayClass = createMockSection(17, [
      { days: [0], startTime: 900, endTime: 1030 },
    ]);
    const weekendOverlap = createMockSection(18, [
      { days: [6], startTime: 1000, endTime: 1130 },
    ]);

    assert.equal(
      hasConflictInSchedule(schedule(saturdayClass, sundayClass)),
      false,
    );
    assert.equal(
      hasConflictInSchedule(schedule(saturdayClass, weekendOverlap)),
      true,
    );
  });
});

/** Every section meets at the SAME time — maximum conflicts, tons of pruning */
function buildAllConflicting(
  numCourses: number,
  sectionsPerCourse: number,
): SectionWithCourse[][] {
  const sectionsByCourse: SectionWithCourse[][] = [];
  for (let c = 0; c < numCourses; c++) {
    const sections: SectionWithCourse[] = [];
    for (let i = 0; i < sectionsPerCourse; i++) {
      sections.push(
        createMockSection(
          (c + 1) * 1000 + i,
          [{ days: [1, 3, 5], startTime: 930, endTime: 1045 }],
          {
            courseId: c + 1,
            courseSubject: SUBJECTS[c % SUBJECTS.length],
            courseNumber: NUMBERS[c % NUMBERS.length],
          },
        ),
      );
    }
    sectionsByCourse.push(sections);
  }
  return sectionsByCourse;
}

/** Every section meets at a UNIQUE time — zero conflicts, no pruning possible */
function buildNoConflicts(
  numCourses: number,
  sectionsPerCourse: number,
): SectionWithCourse[][] {
  const days = [1, 2, 3, 4, 5];
  const sectionsByCourse: SectionWithCourse[][] = [];
  for (let c = 0; c < numCourses; c++) {
    const day = days[c % days.length];
    const baseTime = 800 + c * 60; // each course on its own hour
    const sections: SectionWithCourse[] = [];
    for (let i = 0; i < sectionsPerCourse; i++) {
      sections.push(
        createMockSection(
          (c + 1) * 1000 + i,
          [{ days: [day], startTime: baseTime, endTime: baseTime + 50 }],
          {
            courseId: c + 1,
            courseSubject: SUBJECTS[c % SUBJECTS.length],
            courseNumber: NUMBERS[c % NUMBERS.length],
          },
        ),
      );
    }
    sectionsByCourse.push(sections);
  }
  return sectionsByCourse;
}

/** Mixed: some courses have many sections, some have few (realistic) */
function buildMixedSizes(courseSizes: number[]): SectionWithCourse[][] {
  const sectionsByCourse: SectionWithCourse[][] = [];
  for (let c = 0; c < courseSizes.length; c++) {
    const sections: SectionWithCourse[] = [];
    for (let i = 0; i < courseSizes[c]; i++) {
      const slot = TIME_SLOTS[i % TIME_SLOTS.length];
      const days = DAY_PATTERNS[i % DAY_PATTERNS.length];
      sections.push(
        createMockSection(
          (c + 1) * 1000 + i,
          [{ days, startTime: slot.startTime, endTime: slot.endTime }],
          {
            courseId: c + 1,
            courseSubject: SUBJECTS[c % SUBJECTS.length],
            courseNumber: NUMBERS[c % NUMBERS.length],
          },
        ),
      );
    }
    sectionsByCourse.push(sections);
  }
  return sectionsByCourse;
}

// --- Scaling tests ---

test(
  "extreme: 8 courses × 30 sections (6.56e11 brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 30;
    const sectionsByCourse = buildSectionsByCourse(
      numCourses,
      sectionsPerCourse,
    );

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[extreme] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[extreme] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[extreme] SPEEDUP:   ${speedup.toFixed(1)}x`);

    assert.ok(optimizedResults.length > 0);
    assert.ok(optimizedResults.length <= MAX_RESULTS);
  },
);

test(
  "massive: 10 courses × 15 sections (576 billion brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 10;
    const sectionsPerCourse = 15;
    const sectionsByCourse = buildSectionsByCourse(
      numCourses,
      sectionsPerCourse,
    );

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[massive] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[massive] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[massive] SPEEDUP:   ${speedup.toFixed(1)}x`);

    assert.ok(optimizedResults.length > 0);
    assert.ok(optimizedResults.length <= MAX_RESULTS);
  },
);

test(
  "deep: 12 courses × 10 sections (1 trillion brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 12;
    const sectionsPerCourse = 10;
    const sectionsByCourse = buildSectionsByCourse(
      numCourses,
      sectionsPerCourse,
    );

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[deep] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[deep] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[deep] SPEEDUP:   ${speedup.toFixed(1)}x`);

    // 12 courses share only 8 distinct time slots — no conflict-free complete schedule exists
    assert.strictEqual(
      optimizedResults.length,
      0,
      "overconstrained: no valid schedules expected",
    );
    assert.strictEqual(
      originalResults.length,
      0,
      "overconstrained: no valid schedules expected",
    );
  },
);

test(
  "wide: 6 courses × 50 sections (15.6 billion brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 6;
    const sectionsPerCourse = 50;
    const sectionsByCourse = buildSectionsByCourse(
      numCourses,
      sectionsPerCourse,
    );

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[wide] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[wide] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[wide] SPEEDUP:   ${speedup.toFixed(1)}x`);

    assert.ok(optimizedResults.length > 0);
    assert.ok(optimizedResults.length <= MAX_RESULTS);
  },
);

// --- Adversarial: all sections conflict (worst case for pruning) ---

test(
  "adversarial: all-conflicting 8 × 20 (pruning stress test)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 20;
    const sectionsByCourse = buildAllConflicting(numCourses, sectionsPerCourse);

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[all-conflict] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[all-conflict] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[all-conflict] SPEEDUP:   ${speedup.toFixed(1)}x`);

    // Should find zero valid schedules since everything conflicts
    assert.equal(optimizedResults.length, 0, "no valid schedules should exist");
    assert.equal(originalResults.length, 0, "no valid schedules should exist");
  },
);

// --- Adversarial: zero conflicts (worst case for result count) ---

test(
  "adversarial: no-conflict 8 × 12 (every combo is valid)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 12;
    const sectionsByCourse = buildNoConflicts(numCourses, sectionsPerCourse);

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[no-conflict] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[no-conflict] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[no-conflict] SPEEDUP:   ${speedup.toFixed(1)}x`);

    // Every combo is valid so both should hit the cap
    assert.equal(
      optimizedResults.length,
      MAX_RESULTS,
      "should hit MAX_RESULTS cap",
    );
    assert.equal(
      originalResults.length,
      MAX_RESULTS,
      "should hit MAX_RESULTS cap",
    );
  },
);

// --- Realistic: mixed section counts like real NEU courses ---

test(
  "realistic: mixed sizes [3, 7, 25, 4, 15, 2, 12, 8]",
  { timeout: 120_000 },
  () => {
    const courseSizes = [3, 7, 25, 4, 15, 2, 12, 8];
    const sectionsByCourse = buildMixedSizes(courseSizes);

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(
      sectionsByCourse,
      MAX_RESULTS,
    );
    const elapsedOrig = performance.now() - startOrig;

    const brute = courseSizes.reduce((a, b) => a * b, 1);
    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[realistic] ${courseSizes.join("×")} = ${brute.toLocaleString()} brute force`,
    );
    console.log(
      `[realistic] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[realistic] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[realistic] SPEEDUP:   ${speedup.toFixed(1)}x`);

    assert.ok(optimizedResults.length > 0);
    assert.ok(optimizedResults.length <= MAX_RESULTS);
  },
);

// --- The real test: UNCAPPED, no maxResults on either version ---
// This simulates what was actually running in production before the fix.

test(
  "uncapped: 8 × 12 with NO maxResults (the production scenario)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 12;
    const sectionsByCourse = buildSectionsByCourse(
      numCourses,
      sectionsPerCourse,
    );

    const startOpt = performance.now();
    const optimizedResults = generateCombinationsOptimized(sectionsByCourse);
    const elapsedOpt = performance.now() - startOpt;

    const startOrig = performance.now();
    const originalResults = generateCombinationsOriginal(sectionsByCourse);
    const elapsedOrig = performance.now() - startOrig;

    const speedup = elapsedOrig / elapsedOpt;
    console.log(
      `[uncapped] ORIGINAL:  ${originalResults.length} schedules in ${elapsedOrig.toFixed(2)}ms`,
    );
    console.log(
      `[uncapped] OPTIMIZED: ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
    );
    console.log(`[uncapped] SPEEDUP:   ${speedup.toFixed(1)}x`);

    // Both should find the same total number of valid schedules
    assert.equal(
      optimizedResults.length,
      originalResults.length,
      "both versions should find the same number of schedules when uncapped",
    );
  },
);

// --- Edge cases ---

test("edge: single course, 50 sections", { timeout: 120_000 }, () => {
  const sectionsByCourse = buildSectionsByCourse(1, 50);

  const startOpt = performance.now();
  const optimizedResults = generateCombinationsOptimized(
    sectionsByCourse,
    MAX_RESULTS,
  );
  const elapsedOpt = performance.now() - startOpt;

  console.log(
    `[single] ${optimizedResults.length} schedules in ${elapsedOpt.toFixed(2)}ms`,
  );
  assert.equal(optimizedResults.length, 50, "one section per schedule");
});

test("edge: empty input", { timeout: 120_000 }, () => {
  const optimizedResults = generateCombinationsOptimized([], MAX_RESULTS);
  assert.equal(optimizedResults.length, 0);
});

test(
  "edge: two courses, one section each, conflicting",
  { timeout: 120_000 },
  () => {
    const sectionsByCourse = buildAllConflicting(2, 1);
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    assert.equal(optimizedResults.length, 0, "should find no valid schedule");
  },
);

test(
  "edge: two courses, one section each, non-conflicting",
  { timeout: 120_000 },
  () => {
    const sectionsByCourse = buildNoConflicts(2, 1);
    const optimizedResults = generateCombinationsOptimized(
      sectionsByCourse,
      MAX_RESULTS,
    );
    assert.equal(optimizedResults.length, 1, "exactly one valid schedule");
  },
);

// ---------------------------------------------------------------------------
// Unit tests: incrementIndex
// ---------------------------------------------------------------------------

describe("incrementIndex", () => {
  test("simple increment at last position", () => {
    const idx = [0, 0];
    const overflow = incrementIndex(idx, [3, 3], 1);
    assert.equal(overflow, false);
    assert.deepEqual(idx, [0, 1]);
  });

  test("carry when last position overflows", () => {
    const idx = [0, 2];
    const overflow = incrementIndex(idx, [3, 3], 1);
    assert.equal(overflow, false);
    assert.deepEqual(idx, [1, 0]);
  });

  test("full overflow when all positions exhausted", () => {
    const idx = [2, 2];
    const overflow = incrementIndex(idx, [3, 3], 1);
    assert.equal(overflow, true);
  });

  test("single-element array: overflow immediately", () => {
    const idx = [0];
    const overflow = incrementIndex(idx, [1], 0);
    assert.equal(overflow, true);
  });

  test("single-element array: normal increment", () => {
    const idx = [0];
    const overflow = incrementIndex(idx, [2], 0);
    assert.equal(overflow, false);
    assert.deepEqual(idx, [1]);
  });

  test("increment at position 0", () => {
    const idx = [0, 0, 0];
    const overflow = incrementIndex(idx, [3, 3, 3], 0);
    assert.equal(overflow, false);
    assert.deepEqual(idx, [1, 0, 0]);
  });

  test("carry cascades across multiple positions", () => {
    const idx = [0, 2, 2];
    const overflow = incrementIndex(idx, [3, 3, 3], 2);
    assert.equal(overflow, false);
    assert.deepEqual(idx, [1, 0, 0]);
  });

  test("overflow when first position also wraps", () => {
    const idx = [2, 2, 2];
    const overflow = incrementIndex(idx, [3, 3, 3], 2);
    assert.equal(overflow, true);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: meetingTimesToBinaryMask
// ---------------------------------------------------------------------------

describe("meetingTimesToBinaryMask", () => {
  test("section with no meeting times → mask is zero", () => {
    const s = createMockSection(100, []);
    assert.equal(meetingTimesToBinaryMask(s), BigInt(0));
  });

  test("zero-duration meeting (startTime === endTime) → mask is zero", () => {
    const s = createMockSection(101, [{ days: [1], startTime: 900, endTime: 900 }]);
    assert.equal(meetingTimesToBinaryMask(s), BigInt(0));
  });

  test("two identical sections produce the same mask", () => {
    const a = createMockSection(102, [{ days: [1, 3], startTime: 800, endTime: 850 }]);
    const b = createMockSection(103, [{ days: [1, 3], startTime: 800, endTime: 850 }]);
    assert.equal(meetingTimesToBinaryMask(a), meetingTimesToBinaryMask(b));
  });

  test("same time, different days → different masks, no conflict", () => {
    const mon = createMockSection(104, [{ days: [1], startTime: 900, endTime: 1000 }]);
    const tue = createMockSection(105, [{ days: [2], startTime: 900, endTime: 1000 }]);
    const mMon = meetingTimesToBinaryMask(mon);
    const mTue = meetingTimesToBinaryMask(tue);
    assert.notEqual(mMon, mTue);
    assert.equal((mMon & mTue), BigInt(0));
  });

  test("back-to-back meetings on the same day → no conflict", () => {
    const first  = createMockSection(106, [{ days: [3], startTime: 800,  endTime: 900  }]);
    const second = createMockSection(107, [{ days: [3], startTime: 900,  endTime: 1000 }]);
    const m1 = meetingTimesToBinaryMask(first);
    const m2 = meetingTimesToBinaryMask(second);
    assert.equal((m1 & m2), BigInt(0), "back-to-back should not conflict");
  });

  test("overlapping meetings on the same day → conflict", () => {
    const a = createMockSection(108, [{ days: [2], startTime: 900, endTime: 1000 }]);
    const b = createMockSection(109, [{ days: [2], startTime: 930, endTime: 1030 }]);
    const mA = meetingTimesToBinaryMask(a);
    const mB = meetingTimesToBinaryMask(b);
    assert.notEqual((mA & mB), BigInt(0), "overlapping meetings should conflict");
  });

  test("multi-day meeting sets bits for all specified days", () => {
    const mwf   = createMockSection(110, [{ days: [1, 3, 5], startTime: 900, endTime: 950 }]);
    const monOnly = createMockSection(111, [{ days: [1],    startTime: 900, endTime: 950 }]);
    const wedOnly = createMockSection(112, [{ days: [3],    startTime: 900, endTime: 950 }]);
    const friOnly = createMockSection(113, [{ days: [5],    startTime: 900, endTime: 950 }]);
    const mMwf = meetingTimesToBinaryMask(mwf);
    // MWF mask must conflict with each individual day mask
    assert.notEqual((mMwf & meetingTimesToBinaryMask(monOnly)), BigInt(0));
    assert.notEqual((mMwf & meetingTimesToBinaryMask(wedOnly)), BigInt(0));
    assert.notEqual((mMwf & meetingTimesToBinaryMask(friOnly)), BigInt(0));
  });

  test("multiple meeting blocks in one section are all encoded", () => {
    // Lecture MWF + Lab TR at a different time
    const lectureLab = createMockSection(114, [
      { days: [1, 3, 5], startTime: 900,  endTime: 950  },
      { days: [2, 4],    startTime: 1100, endTime: 1150 },
    ]);
    const conflictsLecture = createMockSection(115, [{ days: [1], startTime: 920, endTime: 1000 }]);
    const conflictsLab     = createMockSection(116, [{ days: [2], startTime: 1130, endTime: 1200 }]);
    const noConflict       = createMockSection(117, [{ days: [1], startTime: 1300, endTime: 1400 }]);

    const mLL = meetingTimesToBinaryMask(lectureLab);
    assert.notEqual((mLL & meetingTimesToBinaryMask(conflictsLecture)), BigInt(0), "lecture block conflict");
    assert.notEqual((mLL & meetingTimesToBinaryMask(conflictsLab)),     BigInt(0), "lab block conflict");
    assert.equal(   (mLL & meetingTimesToBinaryMask(noConflict)),       BigInt(0), "no conflict expected");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: masksConflict
// ---------------------------------------------------------------------------

describe("masksConflict", () => {
  test("both masks zero → no conflict", () => {
    assert.equal(masksConflict(BigInt(0), BigInt(0)), false);
  });

  test("one mask zero → no conflict", () => {
    assert.equal(masksConflict(BigInt(255), BigInt(0)), false);
    assert.equal(masksConflict(BigInt(0), BigInt(255)), false);
  });

  test("non-overlapping masks → no conflict", () => {
    assert.equal(masksConflict(BigInt(0b1010), BigInt(0b0101)), false);
  });

  test("overlapping masks → conflict", () => {
    assert.equal(masksConflict(BigInt(0b1100), BigInt(0b0110)), true);
  });

  test("identical non-zero masks → conflict", () => {
    assert.equal(masksConflict(BigInt(42), BigInt(42)), true);
  });
});

// ---------------------------------------------------------------------------
// generateCombinationsOptimized: empty course guard + mask correctness
// ---------------------------------------------------------------------------

describe("generateCombinationsOptimized — empty course & mask correctness", () => {
  test("single empty course → returns []", () => {
    assert.deepEqual(generateCombinationsOptimized([[]]), []);
  });

  test("empty course among multiple → returns [] (was a crash bug)", () => {
    const s = createMockSection(200, [{ days: [1], startTime: 900, endTime: 1000 }]);
    assert.deepEqual(generateCombinationsOptimized([[s], []]), []);
    assert.deepEqual(generateCombinationsOptimized([[], [s]]), []);
    assert.deepEqual(generateCombinationsOptimized([[s], [], [s]]), []);
  });

  test("single course at exactly maxResults → returns maxResults schedules", () => {
    const sections = Array.from({ length: 5 }, (_, i) =>
      createMockSection(300 + i, [{ days: [i + 1], startTime: 800, endTime: 900 }]),
    );
    const results = generateCombinationsOptimized([sections], 3);
    assert.equal(results.length, 3);
  });

  test("single course exceeding maxResults → capped at maxResults", () => {
    const sections = Array.from({ length: 10 }, (_, i) =>
      createMockSection(400 + i, [{ days: [i % 7], startTime: 800, endTime: 850 }]),
    );
    const results = generateCombinationsOptimized([sections], 4);
    assert.equal(results.length, 4);
  });

  test("returned mask equals OR of all section masks in the schedule", () => {
    const sA = createMockSection(500, [{ days: [1], startTime: 800, endTime: 900 }]);
    const sB = createMockSection(501, [{ days: [2], startTime: 900, endTime: 1000 }]);
    const sC = createMockSection(502, [{ days: [3], startTime: 1000, endTime: 1100 }]);

    const results = generateCombinationsOptimized([[sA], [sB], [sC]]);
    assert.equal(results.length, 1);

    const expected = meetingTimesToBinaryMask(sA) | meetingTimesToBinaryMask(sB) | meetingTimesToBinaryMask(sC);
    assert.equal(results[0].mask, expected);
  });

  test("returned mask is consistent across multiple results", () => {
    const sA1 = createMockSection(600, [{ days: [1], startTime: 800, endTime: 900 }]);
    const sA2 = createMockSection(601, [{ days: [2], startTime: 800, endTime: 900 }]);
    const sB  = createMockSection(602, [{ days: [3], startTime: 800, endTime: 900 }]);

    const results = generateCombinationsOptimized([[sA1, sA2], [sB]]);
    assert.equal(results.length, 2);

    for (const { schedule, mask } of results) {
      const expected = schedule.reduce(
        (acc, s) => acc | meetingTimesToBinaryMask(s),
        BigInt(0),
      );
      assert.equal(mask, expected, `mask mismatch for schedule [${schedule.map(s => s.id)}]`);
    }
  });
});
