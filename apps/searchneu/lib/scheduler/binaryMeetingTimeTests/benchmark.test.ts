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
