import { test } from "node:test";
import assert from "node:assert/strict";
import { SectionWithCourse } from "../filters";
import {
  generateCombinationsOptimized,
  MAX_RESULTS,
} from "../generateCombinations";
import {
  meetingTimesToBinaryMask,
  masksConflict,
  hasConflictInSchedule,
} from "../binaryMeetingTime";
import { incrementIndex } from "../generateCombinations";
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
    const courseSubject = SUBJECTS[c % SUBJECTS.length];
    const courseNumber = NUMBERS[c % NUMBERS.length];
    const sections: SectionWithCourse[] = [];
    for (let i = 0; i < sectionsPerCourse; i++) {
      const slot = TIME_SLOTS[i % TIME_SLOTS.length];
      const days = DAY_PATTERNS[i % DAY_PATTERNS.length];
      sections.push(
        createMockSection(
          courseId * 1000 + i,
          [{ days, startTime: slot.startTime, endTime: slot.endTime }],
          { courseId, courseSubject, courseNumber },
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

function printResult(
  label: string,
  origCount: number,
  origMs: number,
  optCount: number,
  optMs: number,
): void {
  const speedup = origMs / optMs;
  const w = 12;
  console.log(`\n  ┌─ ${label}`);
  console.log(
    `  │  original :  ${String(origCount).padStart(w)} results   ${origMs.toFixed(1).padStart(9)} ms`,
  );
  console.log(
    `  │  optimized:  ${String(optCount).padStart(w)} results   ${optMs.toFixed(1).padStart(9)} ms   (${speedup.toFixed(1)}x faster)`,
  );
  console.log(`  └${"─".repeat(60)}`);
}

test(
  "benchmark small: 4 courses × 8 sections (4,096 brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 4;
    const sectionsPerCourse = 8;
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

    printResult(
      "small  (4 × 8,    4,096 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark medium: 6 courses × 10 sections (1,000,000 brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 6;
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

    printResult(
      "medium (6 × 10,  1,000,000 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark large: 8 courses × 12 sections (429,981,696 brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 12;
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

    printResult(
      "large  (8 × 12,  429,981,696 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark stress: 8 courses × 20 sections (25,600,000,000 brute force)",
  { timeout: 120_000 },
  () => {
    const numCourses = 8;
    const sectionsPerCourse = 20;
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

    printResult(
      "stress (8 × 20,  25,600,000,000 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark extreme: 8 courses × 30 sections (6.56e11 brute force combos)",
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

    printResult(
      "extreme (8 × 30,  6.56e11 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark massive: 10 courses × 15 sections (576,650,390,625 brute force combos)",
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

    printResult(
      "massive (10 × 15, 576,650,390,625 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark deep: 12 courses × 10 sections (1e12 brute force combos)",
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

    printResult(
      "deep   (12 × 10, 1e12 brute force — overconstrained, 0 expected)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    // 12 courses share only 8 distinct time slots, so no conflict-free complete schedule
    // exists in this mock data. The test benchmarks how fast both versions can exhaust the
    // search space and correctly determine there are no valid schedules.
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
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
  },
);

test(
  "benchmark wide: 6 courses × 50 sections (15,625,000,000 brute force combos)",
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

    printResult(
      "wide   (6 × 50,  15,625,000,000 brute force)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.ok(
      optimizedResults.length > 0,
      "should find at least one valid schedule",
    );
    assert.ok(
      optimizedResults.length <= MAX_RESULTS,
      "should not exceed MAX_RESULTS",
    );
    assert.ok(
      elapsedOpt < 10_000,
      `should complete under 10s, took ${elapsedOpt.toFixed(2)}ms`,
    );
    for (const { schedule } of optimizedResults) {
      assert.strictEqual(
        schedule.length,
        numCourses,
        "each schedule should have one section per course",
      );
      assert.equal(
        hasConflictInSchedule(schedule),
        false,
        "no schedule should have time conflicts",
      );
    }
  },
);

test(
  "benchmark uncapped: 8 courses × 12 sections - no maxResults (real production difference)",
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

    printResult(
      "uncapped (8 × 12, no cap — full exhaustion)",
      originalResults.length,
      elapsedOrig,
      optimizedResults.length,
      elapsedOpt,
    );

    assert.strictEqual(
      optimizedResults.length,
      originalResults.length,
      "both versions should find the same total number of valid schedules",
    );
  },
);

// ---------------------------------------------------------------------------
// Helper builders for adversarial / realistic scenarios
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Scaling comparison tests
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Adversarial tests
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Realistic mixed sizes test
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Uncapped production scenario
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

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
