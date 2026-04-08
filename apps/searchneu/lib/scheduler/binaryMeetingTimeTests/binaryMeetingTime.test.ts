import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  generateCombinationsOptimized,
  incrementIndex,
} from "../generateCombinations";
import {
  hasConflictInSchedule,
  meetingTimesToBinaryMask,
  masksConflict,
} from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

// ---------------------------------------------------------------------------
// Unit tests: hasConflictInSchedule
// ---------------------------------------------------------------------------

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
    const s = createMockSection(101, [
      { days: [1], startTime: 900, endTime: 900 },
    ]);
    assert.equal(meetingTimesToBinaryMask(s), BigInt(0));
  });

  test("two identical sections produce the same mask", () => {
    const a = createMockSection(102, [
      { days: [1, 3], startTime: 800, endTime: 850 },
    ]);
    const b = createMockSection(103, [
      { days: [1, 3], startTime: 800, endTime: 850 },
    ]);
    assert.equal(meetingTimesToBinaryMask(a), meetingTimesToBinaryMask(b));
  });

  test("same time, different days → different masks, no conflict", () => {
    const mon = createMockSection(104, [
      { days: [1], startTime: 900, endTime: 1000 },
    ]);
    const tue = createMockSection(105, [
      { days: [2], startTime: 900, endTime: 1000 },
    ]);
    const mMon = meetingTimesToBinaryMask(mon);
    const mTue = meetingTimesToBinaryMask(tue);
    assert.notEqual(mMon, mTue);
    assert.equal(mMon & mTue, BigInt(0));
  });

  test("back-to-back meetings on the same day → no conflict", () => {
    const first = createMockSection(106, [
      { days: [3], startTime: 800, endTime: 900 },
    ]);
    const second = createMockSection(107, [
      { days: [3], startTime: 900, endTime: 1000 },
    ]);
    const m1 = meetingTimesToBinaryMask(first);
    const m2 = meetingTimesToBinaryMask(second);
    assert.equal(m1 & m2, BigInt(0), "back-to-back should not conflict");
  });

  test("overlapping meetings on the same day → conflict", () => {
    const a = createMockSection(108, [
      { days: [2], startTime: 900, endTime: 1000 },
    ]);
    const b = createMockSection(109, [
      { days: [2], startTime: 930, endTime: 1030 },
    ]);
    const mA = meetingTimesToBinaryMask(a);
    const mB = meetingTimesToBinaryMask(b);
    assert.notEqual(mA & mB, BigInt(0), "overlapping meetings should conflict");
  });

  test("multi-day meeting sets bits for all specified days", () => {
    const mwf = createMockSection(110, [
      { days: [1, 3, 5], startTime: 900, endTime: 950 },
    ]);
    const monOnly = createMockSection(111, [
      { days: [1], startTime: 900, endTime: 950 },
    ]);
    const wedOnly = createMockSection(112, [
      { days: [3], startTime: 900, endTime: 950 },
    ]);
    const friOnly = createMockSection(113, [
      { days: [5], startTime: 900, endTime: 950 },
    ]);
    const mMwf = meetingTimesToBinaryMask(mwf);
    // MWF mask must conflict with each individual day mask
    assert.notEqual(mMwf & meetingTimesToBinaryMask(monOnly), BigInt(0));
    assert.notEqual(mMwf & meetingTimesToBinaryMask(wedOnly), BigInt(0));
    assert.notEqual(mMwf & meetingTimesToBinaryMask(friOnly), BigInt(0));
  });

  test("multiple meeting blocks in one section are all encoded", () => {
    // Lecture MWF + Lab TR at a different time
    const lectureLab = createMockSection(114, [
      { days: [1, 3, 5], startTime: 900, endTime: 950 },
      { days: [2, 4], startTime: 1100, endTime: 1150 },
    ]);
    const conflictsLecture = createMockSection(115, [
      { days: [1], startTime: 920, endTime: 1000 },
    ]);
    const conflictsLab = createMockSection(116, [
      { days: [2], startTime: 1130, endTime: 1200 },
    ]);
    const noConflict = createMockSection(117, [
      { days: [1], startTime: 1300, endTime: 1400 },
    ]);

    const mLL = meetingTimesToBinaryMask(lectureLab);
    assert.notEqual(
      mLL & meetingTimesToBinaryMask(conflictsLecture),
      BigInt(0),
      "lecture block conflict",
    );
    assert.notEqual(
      mLL & meetingTimesToBinaryMask(conflictsLab),
      BigInt(0),
      "lab block conflict",
    );
    assert.equal(
      mLL & meetingTimesToBinaryMask(noConflict),
      BigInt(0),
      "no conflict expected",
    );
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
    const s = createMockSection(200, [
      { days: [1], startTime: 900, endTime: 1000 },
    ]);
    assert.deepEqual(generateCombinationsOptimized([[s], []]), []);
    assert.deepEqual(generateCombinationsOptimized([[], [s]]), []);
    assert.deepEqual(generateCombinationsOptimized([[s], [], [s]]), []);
  });

  test("single course at exactly maxResults → returns maxResults schedules", () => {
    const sections = Array.from({ length: 5 }, (_, i) =>
      createMockSection(300 + i, [
        { days: [i + 1], startTime: 800, endTime: 900 },
      ]),
    );
    const results = generateCombinationsOptimized([sections], 3);
    assert.equal(results.length, 3);
  });

  test("single course exceeding maxResults → capped at maxResults", () => {
    const sections = Array.from({ length: 10 }, (_, i) =>
      createMockSection(400 + i, [
        { days: [i % 7], startTime: 800, endTime: 850 },
      ]),
    );
    const results = generateCombinationsOptimized([sections], 4);
    assert.equal(results.length, 4);
  });

  test("returned mask equals OR of all section masks in the schedule", () => {
    const sA = createMockSection(500, [
      { days: [1], startTime: 800, endTime: 900 },
    ]);
    const sB = createMockSection(501, [
      { days: [2], startTime: 900, endTime: 1000 },
    ]);
    const sC = createMockSection(502, [
      { days: [3], startTime: 1000, endTime: 1100 },
    ]);

    const results = generateCombinationsOptimized([[sA], [sB], [sC]]);
    assert.equal(results.length, 1);

    const expected =
      meetingTimesToBinaryMask(sA) |
      meetingTimesToBinaryMask(sB) |
      meetingTimesToBinaryMask(sC);
    assert.equal(results[0].mask, expected);
  });

  test("returned mask is consistent across multiple results", () => {
    const sA1 = createMockSection(600, [
      { days: [1], startTime: 800, endTime: 900 },
    ]);
    const sA2 = createMockSection(601, [
      { days: [2], startTime: 800, endTime: 900 },
    ]);
    const sB = createMockSection(602, [
      { days: [3], startTime: 800, endTime: 900 },
    ]);

    const results = generateCombinationsOptimized([[sA1, sA2], [sB]]);
    assert.equal(results.length, 2);

    for (const { schedule, mask } of results) {
      const expected = schedule.reduce(
        (acc, s) => acc | meetingTimesToBinaryMask(s),
        BigInt(0),
      );
      assert.equal(
        mask,
        expected,
        `mask mismatch for schedule [${schedule.map((s) => s.id)}]`,
      );
    }
  });
});
