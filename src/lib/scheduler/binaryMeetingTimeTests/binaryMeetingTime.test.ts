import test, { describe } from "node:test";
import assert from "node:assert/strict";

import { hasConflictInSchedule } from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

// Test suite for hasConflictInSchedule function
describe("hasConflictInSchedule", () => {
    // helper function to create a schedule from mock sections
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
});