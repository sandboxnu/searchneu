import test from "node:test";
import assert from "node:assert/strict";

import {
    hasConflictInSchedule,
    hasConflictWithMask,
    meetingTimesToBinaryMask,
} from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

// Helper to build schedule arrays quickly
const schedule = (...sections: ReturnType<typeof createMockSection>[]) => sections;

test("returns false when sections are on different days", () => {
    const sectionA = createMockSection(1, [{ days: [1, 3, 5], startTime: 930, endTime: 1045 }]);
    const sectionB = createMockSection(2, [{ days: [2, 4], startTime: 930, endTime: 1045 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), false);
});

test("detects complete overlap on same day", () => {
    const sectionA = createMockSection(1, [{ days: [1], startTime: 900, endTime: 1100 }]);
    const sectionB = createMockSection(2, [{ days: [1], startTime: 900, endTime: 1100 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), true);
});

test("detects partial overlap on same day", () => {
    const sectionA = createMockSection(1, [{ days: [2], startTime: 930, endTime: 1045 }]);
    const sectionB = createMockSection(2, [{ days: [2], startTime: 1000, endTime: 1115 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), true);
});

test("no conflict when meetings are back-to-back", () => {
    const sectionA = createMockSection(1, [{ days: [3], startTime: 900, endTime: 1000 }]);
    const sectionB = createMockSection(2, [{ days: [3], startTime: 1000, endTime: 1100 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB)), false);
});

test("detects conflict across multiple sections", () => {
    const sectionA = createMockSection(1, [{ days: [4], startTime: 800, endTime: 915 }]);
    const sectionB = createMockSection(2, [{ days: [4], startTime: 930, endTime: 1045 }]);
    const sectionC = createMockSection(3, [{ days: [4], startTime: 900, endTime: 945 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionA, sectionB, sectionC)), true);
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

    assert.equal(hasConflictInSchedule(schedule(emptySectionA, emptySectionB)), false);

    const mixedSection = createMockSection(9, [{ days: [1], startTime: 900, endTime: 950 }]);
    assert.equal(hasConflictInSchedule(schedule(emptySectionA, mixedSection)), false);
});

test("meeting blocks spanning multiple days still detect conflicts", () => {
    const multiDay = createMockSection(10, [{ days: [1, 3], startTime: 900, endTime: 950 }]);
    const overlapMonday = createMockSection(11, [{ days: [1], startTime: 930, endTime: 1000 }]);
    const overlapWednesday = createMockSection(12, [{ days: [3], startTime: 915, endTime: 945 }]);

    assert.equal(hasConflictInSchedule(schedule(multiDay, overlapMonday)), true);
    assert.equal(hasConflictInSchedule(schedule(multiDay, overlapWednesday)), true);
});

test("supports meeting times not aligned to 30-minute increments", () => {
    const sectionWithOddEnd = createMockSection(13, [{ days: [2], startTime: 900, endTime: 1005 }]);
    const overlappingSection = createMockSection(14, [{ days: [2], startTime: 1000, endTime: 1100 }]);
    const nonOverlappingSection = createMockSection(15, [{ days: [2], startTime: 1010, endTime: 1100 }]);

    assert.equal(hasConflictInSchedule(schedule(sectionWithOddEnd, overlappingSection)), true);
    assert.equal(hasConflictInSchedule(schedule(sectionWithOddEnd, nonOverlappingSection)), false);
});

test("handles weekend meeting times", () => {
    const saturdayClass = createMockSection(16, [{ days: [6], startTime: 900, endTime: 1030 }]);
    const sundayClass = createMockSection(17, [{ days: [0], startTime: 900, endTime: 1030 }]);
    const weekendOverlap = createMockSection(18, [{ days: [6], startTime: 1000, endTime: 1130 }]);

    assert.equal(hasConflictInSchedule(schedule(saturdayClass, sundayClass)), false);
    assert.equal(hasConflictInSchedule(schedule(saturdayClass, weekendOverlap)), true);
});

// Tests for incremental conflict checking with masks
test("hasConflictWithMask detects conflict with cumulative mask", () => {
    const sectionA = createMockSection(1, [{ days: [1], startTime: 900, endTime: 1000 }]);
    const sectionB = createMockSection(2, [{ days: [1], startTime: 950, endTime: 1050 }]);

    const maskA = meetingTimesToBinaryMask(sectionA);
    assert.equal(hasConflictWithMask(sectionB, maskA), true);
});

test("hasConflictWithMask returns false when no conflict", () => {
    const sectionA = createMockSection(1, [{ days: [1], startTime: 900, endTime: 1000 }]);
    const sectionB = createMockSection(2, [{ days: [1], startTime: 1000, endTime: 1100 }]);

    const maskA = meetingTimesToBinaryMask(sectionA);
    assert.equal(hasConflictWithMask(sectionB, maskA), false);
});

test("hasConflictWithMask works with multiple sections in cumulative mask", () => {
    const sectionA = createMockSection(1, [{ days: [1], startTime: 900, endTime: 1000 }]);
    const sectionB = createMockSection(2, [{ days: [2], startTime: 900, endTime: 1000 }]);
    const sectionC = createMockSection(3, [{ days: [1], startTime: 950, endTime: 1050 }]);

    // Build cumulative mask from sections A and B
    const maskA = meetingTimesToBinaryMask(sectionA);
    const maskB = meetingTimesToBinaryMask(sectionB);
    const cumulativeMask = maskA | maskB;

    // Section C conflicts with section A (both on day 1)
    assert.equal(hasConflictWithMask(sectionC, cumulativeMask), true);
});

test("hasConflictWithMask handles empty cumulative mask", () => {
    const sectionA = createMockSection(1, [{ days: [1], startTime: 900, endTime: 1000 }]);
    const emptyMask = BigInt(0);

    assert.equal(hasConflictWithMask(sectionA, emptyMask), false);
});

test("hasConflictWithMask handles sections with no meeting times", () => {
    const emptySection = createMockSection(1, []);
    const sectionWithTimes = createMockSection(2, [{ days: [1], startTime: 900, endTime: 1000 }]);

    const mask = meetingTimesToBinaryMask(sectionWithTimes);
    assert.equal(hasConflictWithMask(emptySection, mask), false);
});