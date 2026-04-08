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
