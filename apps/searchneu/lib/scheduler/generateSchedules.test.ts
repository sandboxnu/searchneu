import { describe, test } from "node:test";
import assert from "node:assert";

// Test the core logic of conflict detection and schedule generation
// These tests focus on the logic that can be tested without database mocking

describe("schedule generation logic", () => {
  // Test conflict detection logic
  // This mirrors the hasTimeConflict logic in generateSchedules.ts
  const hasTimeConflict = (
    time1: { days: number[]; startTime: number; endTime: number },
    time2: { days: number[]; startTime: number; endTime: number }
  ): boolean => {
    // Check if they share any days
    const sharedDays = time1.days.filter((day) => time2.days.includes(day));
    if (sharedDays.length === 0) return false;

    // Check if time ranges overlap
    return !(time1.endTime <= time2.startTime || time2.endTime <= time1.startTime);
  };

  describe("time conflict detection", () => {
    test("should detect conflicts when times overlap on same days", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1030 };
      const time2 = { days: [1, 3], startTime: 1000, endTime: 1130 };

      // They share days [1, 3] and times overlap (900-1030 overlaps with 1000-1130)
      assert.strictEqual(hasTimeConflict(time1, time2), true);
    });

    test("should not detect conflicts when times don't overlap", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1030 };
      const time2 = { days: [1, 3], startTime: 1100, endTime: 1230 };

      // They share days but times don't overlap (1030 <= 1100)
      assert.strictEqual(hasTimeConflict(time1, time2), false);
    });

    test("should not detect conflicts when days don't overlap", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1030 };
      const time2 = { days: [2, 4], startTime: 900, endTime: 1030 };

      // Different days, so no conflict even though times are the same
      assert.strictEqual(hasTimeConflict(time1, time2), false);
    });

    test("should handle exact time boundaries correctly", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1030 };
      const time2 = { days: [1, 3], startTime: 1030, endTime: 1200 };

      // One ends exactly when the other starts - should not conflict
      assert.strictEqual(hasTimeConflict(time1, time2), false);
    });

    test("should detect conflicts with partial day overlap", () => {
      const time1 = { days: [1, 3, 5], startTime: 900, endTime: 1030 };
      const time2 = { days: [3, 5], startTime: 1000, endTime: 1130 };

      // They share days [3, 5] and times overlap
      assert.strictEqual(hasTimeConflict(time1, time2), true);
    });

    test("should not conflict when one completely contains the other but different days", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1200 };
      const time2 = { days: [2, 4], startTime: 1000, endTime: 1100 };

      // Different days, so no conflict
      assert.strictEqual(hasTimeConflict(time1, time2), false);
    });

    test("should detect conflicts when one time completely contains the other on same days", () => {
      const time1 = { days: [1, 3], startTime: 900, endTime: 1200 };
      const time2 = { days: [1, 3], startTime: 1000, endTime: 1100 };

      // Time2 is completely within time1 on the same days
      assert.strictEqual(hasTimeConflict(time1, time2), true);
    });
  });

  describe("combination generation logic", () => {
    // Test the logic for generating combinations
    // This mirrors the generateCombinations logic in generateSchedules.ts
    const generateCombinations = <T>(arrays: T[][]): T[][] => {
      if (arrays.length === 0) return [];
      if (arrays.length === 1) return arrays[0].map((item) => [item]);

      const result: T[][] = [];

      const generateRecursive = (currentCombination: T[], arrayIndex: number) => {
        if (arrayIndex === arrays.length) {
          result.push([...currentCombination]);
          return;
        }

        for (const item of arrays[arrayIndex]) {
          currentCombination.push(item);
          generateRecursive(currentCombination, arrayIndex + 1);
          currentCombination.pop();
        }
      };

      generateRecursive([], 0);
      return result;
    };

    test("should return empty array for empty input", () => {
      const result = generateCombinations([]);
      assert.deepStrictEqual(result, []);
    });

    test("should return single items for single array", () => {
      const result = generateCombinations([[1, 2, 3]]);
      assert.deepStrictEqual(result, [[1], [2], [3]]);
    });

    test("should generate all combinations for two arrays", () => {
      const result = generateCombinations([
        ["A", "B"],
        ["1", "2"],
      ]);
      assert.deepStrictEqual(result, [
        ["A", "1"],
        ["A", "2"],
        ["B", "1"],
        ["B", "2"],
      ]);
    });

    test("should generate all combinations for three arrays", () => {
      const result = generateCombinations([
        ["A"],
        ["1", "2"],
        ["X", "Y"],
      ]);
      assert.deepStrictEqual(result, [
        ["A", "1", "X"],
        ["A", "1", "Y"],
        ["A", "2", "X"],
        ["A", "2", "Y"],
      ]);
    });

    test("should handle arrays with different lengths", () => {
      const result = generateCombinations([
        ["A", "B", "C"],
        ["1"],
        ["X", "Y"],
      ]);
      assert.deepStrictEqual(result, [
        ["A", "1", "X"],
        ["A", "1", "Y"],
        ["B", "1", "X"],
        ["B", "1", "Y"],
        ["C", "1", "X"],
        ["C", "1", "Y"],
      ]);
    });
  });

  describe("schedule validation logic", () => {
    // Test the logic for validating schedules
    // This mirrors the isValidSchedule and sectionsHaveConflict logic
    const hasTimeConflict = (
      time1: { days: number[]; startTime: number; endTime: number },
      time2: { days: number[]; startTime: number; endTime: number }
    ): boolean => {
      const sharedDays = time1.days.filter((day) => time2.days.includes(day));
      if (sharedDays.length === 0) return false;
      return !(time1.endTime <= time2.startTime || time2.endTime <= time1.startTime);
    };

    const sectionsHaveConflict = (
      section1: { meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }> },
      section2: { meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }> }
    ): boolean => {
      for (const time1 of section1.meetingTimes) {
        for (const time2 of section2.meetingTimes) {
          if (hasTimeConflict(time1, time2)) {
            return true;
          }
        }
      }
      return false;
    };

    const isValidSchedule = (
      sections: Array<{ meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }> }>
    ): boolean => {
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          if (sectionsHaveConflict(sections[i], sections[j])) {
            return false;
          }
        }
      }
      return true;
    };

    test("should validate schedule with no conflicts", () => {
      const schedule = [
        {
          meetingTimes: [
            { days: [1, 3], startTime: 900, endTime: 1030 },
          ],
        },
        {
          meetingTimes: [
            { days: [2, 4], startTime: 1100, endTime: 1230 },
          ],
        },
      ];

      assert.strictEqual(isValidSchedule(schedule), true);
    });

    test("should invalidate schedule with conflicts", () => {
      const schedule = [
        {
          meetingTimes: [
            { days: [1, 3], startTime: 900, endTime: 1030 },
          ],
        },
        {
          meetingTimes: [
            { days: [1, 3], startTime: 1000, endTime: 1130 },
          ],
        },
      ];

      assert.strictEqual(isValidSchedule(schedule), false);
    });

    test("should validate schedule with multiple meeting times per section", () => {
      const schedule = [
        {
          meetingTimes: [
            { days: [1], startTime: 900, endTime: 1030 },
            { days: [3], startTime: 900, endTime: 1030 },
          ],
        },
        {
          meetingTimes: [
            { days: [2, 4], startTime: 1100, endTime: 1230 },
          ],
        },
      ];

      assert.strictEqual(isValidSchedule(schedule), true);
    });

    test("should invalidate schedule when one meeting time conflicts", () => {
      const schedule = [
        {
          meetingTimes: [
            { days: [1], startTime: 900, endTime: 1030 },
            { days: [3], startTime: 900, endTime: 1030 },
          ],
        },
        {
          meetingTimes: [
            { days: [1], startTime: 1000, endTime: 1130 }, // Conflicts with first section's Monday meeting
            { days: [4], startTime: 1100, endTime: 1230 },
          ],
        },
      ];

      assert.strictEqual(isValidSchedule(schedule), false);
    });

    test("should validate schedule with sections having no meeting times", () => {
      const schedule = [
        {
          meetingTimes: [],
        },
        {
          meetingTimes: [
            { days: [1, 3], startTime: 900, endTime: 1030 },
          ],
        },
      ];

      assert.strictEqual(isValidSchedule(schedule), true);
    });
  });

  describe("optional courses logic", () => {
    // Test the logic for adding optional courses to locked schedules
    // This mirrors the addOptionalCourses logic in generateSchedules.ts
    type Section = {
      id: number;
      meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }>;
    };

    const hasTimeConflict = (
      time1: { days: number[]; startTime: number; endTime: number },
      time2: { days: number[]; startTime: number; endTime: number }
    ): boolean => {
      const sharedDays = time1.days.filter((day) => time2.days.includes(day));
      if (sharedDays.length === 0) return false;
      return !(time1.endTime <= time2.startTime || time2.endTime <= time1.startTime);
    };

    const sectionsHaveConflict = (section1: Section, section2: Section): boolean => {
      for (const time1 of section1.meetingTimes) {
        for (const time2 of section2.meetingTimes) {
          if (hasTimeConflict(time1, time2)) {
            return true;
          }
        }
      }
      return false;
    };

    const isValidSchedule = (sections: Section[]): boolean => {
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          if (sectionsHaveConflict(sections[i], sections[j])) {
            return false;
          }
        }
      }
      return true;
    };

    const addOptionalCourses = (
      baseSchedule: Section[],
      optionalSectionsByCourse: Section[][]
    ): Section[][] => {
      const results: Section[][] = [];

      const generateOptionalCombinations = (
        currentSchedule: Section[],
        courseIndex: number
      ) => {
        if (courseIndex === optionalSectionsByCourse.length) {
          results.push([...currentSchedule]);
          return;
        }

        // Try not adding this optional course
        generateOptionalCombinations(currentSchedule, courseIndex + 1);

        // Try adding each section of this optional course if it doesn't conflict
        for (const section of optionalSectionsByCourse[courseIndex]) {
          const testSchedule = [...currentSchedule, section];
          if (isValidSchedule(testSchedule)) {
            generateOptionalCombinations(testSchedule, courseIndex + 1);
          }
        }
      };

      generateOptionalCombinations(baseSchedule, 0);
      return results;
    };

    test("should return only base schedule when no optional courses", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1, 3], startTime: 900, endTime: 1030 }],
        },
      ];

      const result = addOptionalCourses(baseSchedule, []);

      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result[0], baseSchedule);
    });

    test("should add optional course when it doesn't conflict", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1, 3], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [2, 4], startTime: 1100, endTime: 1230 }],
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 2 schedules: one with and one without the optional course
      assert.strictEqual(result.length, 2);

      // One should be just the base schedule
      assert.strictEqual(result.some(s => s.length === 1 && s[0].id === 1), true);

      // One should include both courses
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 2)), true);
    });

    test("should not add optional course when it conflicts", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1, 3], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [1, 3], startTime: 1000, endTime: 1130 }], // Conflicts
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should only have 1 schedule: the base schedule without the conflicting optional course
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].length, 1);
      assert.strictEqual(result[0][0].id, 1);
    });

    test("should try multiple sections of an optional course", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1, 3], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [1, 3], startTime: 1000, endTime: 1130 }], // Conflicts
          },
          {
            id: 3,
            meetingTimes: [{ days: [2, 4], startTime: 1100, endTime: 1230 }], // Doesn't conflict
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 2 schedules: one without optional, one with section 3
      assert.strictEqual(result.length, 2);

      // One should be just the base schedule
      assert.strictEqual(result.some(s => s.length === 1 && s[0].id === 1), true);

      // One should include section 3 (not section 2 which conflicts)
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 3)), true);
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 2)), false);
    });

    test("should generate all valid subsets of multiple optional courses", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [2], startTime: 1100, endTime: 1230 }],
          },
        ],
        [
          {
            id: 3,
            meetingTimes: [{ days: [3], startTime: 1300, endTime: 1430 }],
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 4 schedules: none, just 2, just 3, both 2 and 3
      assert.strictEqual(result.length, 4);

      // Check all combinations exist
      assert.strictEqual(result.some(s => s.length === 1 && s[0].id === 1), true); // Just base
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 2) && !s.some(sec => sec.id === 3)), true); // Base + 2
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 3) && !s.some(sec => sec.id === 2)), true); // Base + 3
      assert.strictEqual(result.some(s => s.length === 3 && s.some(sec => sec.id === 2) && s.some(sec => sec.id === 3)), true); // Base + 2 + 3
    });

    test("should handle optional courses that conflict with each other", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [2], startTime: 1100, endTime: 1230 }],
          },
        ],
        [
          {
            id: 3,
            meetingTimes: [{ days: [2], startTime: 1130, endTime: 1300 }], // Conflicts with course 2
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 3 schedules: none, just 2, just 3 (but NOT both 2 and 3)
      assert.strictEqual(result.length, 3);

      // Check combinations
      assert.strictEqual(result.some(s => s.length === 1 && s[0].id === 1), true); // Just base
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 2) && !s.some(sec => sec.id === 3)), true); // Base + 2
      assert.strictEqual(result.some(s => s.length === 2 && s.some(sec => sec.id === 3) && !s.some(sec => sec.id === 2)), true); // Base + 3
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 2) && s.some(sec => sec.id === 3)), false); // NOT both 2 and 3
    });

    test("should handle empty base schedule", () => {
      const baseSchedule: Section[] = [];

      const optionalSections: Section[][] = [
        [
          {
            id: 1,
            meetingTimes: [{ days: [1], startTime: 900, endTime: 1030 }],
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 2 schedules: empty and with section 1
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result.some(s => s.length === 0), true);
      assert.strictEqual(result.some(s => s.length === 1 && s[0].id === 1), true);
    });

    test("should handle complex scenario with multiple sections per optional course", () => {
      const baseSchedule: Section[] = [
        {
          id: 1,
          meetingTimes: [{ days: [1], startTime: 900, endTime: 1030 }],
        },
      ];

      const optionalSections: Section[][] = [
        [
          {
            id: 2,
            meetingTimes: [{ days: [1], startTime: 1000, endTime: 1130 }], // Conflicts
          },
          {
            id: 3,
            meetingTimes: [{ days: [2], startTime: 1100, endTime: 1230 }], // Doesn't conflict
          },
        ],
        [
          {
            id: 4,
            meetingTimes: [{ days: [3], startTime: 1300, endTime: 1430 }],
          },
        ],
      ];

      const result = addOptionalCourses(baseSchedule, optionalSections);

      // Should have 4 schedules: none, just 3, just 4, both 3 and 4
      assert.strictEqual(result.length, 4);

      // Should NOT include section 2 (conflicts with base)
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 2)), false);

      // Should include various combinations of 3 and 4
      assert.strictEqual(result.some(s => s.length === 1), true); // Just base
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 3) && !s.some(sec => sec.id === 4)), true); // Base + 3
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 4) && !s.some(sec => sec.id === 3)), true); // Base + 4
      assert.strictEqual(result.some(s => s.some(sec => sec.id === 3) && s.some(sec => sec.id === 4)), true); // Base + 3 + 4
    });
  });
});

