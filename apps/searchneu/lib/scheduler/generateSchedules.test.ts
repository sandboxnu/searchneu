import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { generateSchedules } from "./generateSchedules";
import { buildCourseGroups, type CourseGroup } from "./courseGroups";
import { hasConflictInSchedule } from "./binaryMeetingTime";
import { SectionWithCourse } from "./filters";
import { createMockSection } from "./binaryMeetingTimeTests/mocks";

const MON = [1];
const TUE = [2];

/** A section of `courseId`, meeting on `days` from `start` to `end`. */
const section = (
  id: number,
  courseId: number,
  days: number[],
  start: number,
  end: number,
): SectionWithCourse =>
  createMockSection(id, [{ days, startTime: start, endTime: end }], {
    courseId,
    courseNumber: String(courseId),
  });

/**
 * Build groups the way the route does, from groupings of course IDs and the
 * sections available for each course.
 */
const groupsFrom = (
  groupings: number[][],
  sections: SectionWithCourse[],
): CourseGroup[] => {
  const byCourse = new Map<number, SectionWithCourse[]>();
  for (const s of sections) {
    byCourse.set(s.courseId, [...(byCourse.get(s.courseId) ?? []), s]);
  }
  return buildCourseGroups(groupings, byCourse);
};

const courseIdsIn = (schedule: SectionWithCourse[]): number[] =>
  [...new Set(schedule.map((s) => s.courseId))].sort((a, b) => a - b);

describe("generateSchedules", () => {
  describe("corequisite groups", () => {
    // Course 1 is a lecture, course 2 its lab: one group.
    const lectureAndLab = [
      section(10, 1, MON, 900, 1000),
      section(11, 1, MON, 1100, 1200),
      section(20, 2, TUE, 900, 1000),
    ];

    test("never splits a group across a schedule", () => {
      const groups = groupsFrom([[1, 2]], lectureAndLab);
      const schedules = generateSchedules(groups, [], 1);

      assert.ok(schedules.length > 0, "expected at least one schedule");
      for (const schedule of schedules) {
        assert.deepEqual(courseIdsIn(schedule), [1, 2]);
      }
    });

    test("never splits a group when the group is optional", () => {
      const groups = groupsFrom(
        [[1, 2], [3]],
        [...lectureAndLab, section(30, 3, TUE, 1400, 1500)],
      );
      const [lectureGroup, solo] = groups;
      const schedules = generateSchedules([], [lectureGroup, solo], 1);

      assert.ok(schedules.length > 0);
      for (const schedule of schedules) {
        const ids = courseIdsIn(schedule);
        // Either the pair travelled together, or neither was taken.
        assert.ok(
          ids.includes(1) === ids.includes(2),
          `group was split: ${ids}`,
        );
      }
    });

    test("counts a group once towards the requested course count", () => {
      // Two groups: the lecture/lab pair, and a standalone course.
      const groups = groupsFrom(
        [[1, 2], [3]],
        [...lectureAndLab, section(30, 3, TUE, 1400, 1500)],
      );

      // Asking for two courses must yield both groups, which is three courses.
      const schedules = generateSchedules([], groups, 2);
      assert.ok(schedules.length > 0);
      for (const schedule of schedules) {
        assert.deepEqual(courseIdsIn(schedule), [1, 2, 3]);
      }

      // Asking for one must yield exactly one group, never a split pair.
      for (const schedule of generateSchedules([], groups, 1)) {
        const ids = courseIdsIn(schedule);
        assert.ok(
          ids.join() === [1, 2].join() || ids.join() === "3",
          `unexpected selection: ${ids}`,
        );
      }
    });

    test("drops a group whose courses can never fit together", () => {
      // The only lab overlaps the only lecture, so the group is unschedulable.
      const clashing = [
        section(10, 1, MON, 900, 1000),
        section(20, 2, MON, 930, 1030),
      ];
      const groups = groupsFrom([[1, 2]], clashing);

      assert.equal(groups[0].options.length, 0);
      assert.deepEqual(generateSchedules(groups, [], 1), []);
      // As an optional group it is simply never taken, not an error.
      assert.deepEqual(generateSchedules([], groups, 1), []);
    });

    test("counts a group once even when it is locked", () => {
      const groups = groupsFrom(
        [[1, 2], [3]],
        [...lectureAndLab, section(30, 3, TUE, 1400, 1500)],
      );
      const [pair, solo] = groups;

      // Locking the pair leaves one group's worth of room when asking for two.
      const schedules = generateSchedules([pair], [solo], 2);
      assert.ok(schedules.length > 0);
      for (const schedule of schedules) {
        assert.deepEqual(courseIdsIn(schedule), [1, 2, 3]);
      }
    });
  });

  describe("locked and optional groups", () => {
    const sections = [
      section(10, 1, MON, 900, 1000),
      section(20, 2, MON, 1100, 1200),
      section(30, 3, TUE, 900, 1000),
    ];

    test("every locked group appears in every schedule", () => {
      const [a, b, c] = groupsFrom([[1], [2], [3]], sections);
      for (const schedule of generateSchedules([a, b], [c], 3)) {
        assert.ok(courseIdsIn(schedule).includes(1));
        assert.ok(courseIdsIn(schedule).includes(2));
      }
    });

    test("returns nothing when a locked group has no sections", () => {
      const groups = groupsFrom([[1], [99]], sections);
      assert.deepEqual(generateSchedules(groups, [], 2), []);
    });

    test("returns nothing when asked for no courses at all", () => {
      assert.deepEqual(generateSchedules([], [], 3), []);
    });

    test("produces only conflict-free schedules", () => {
      const overlapping = [
        section(10, 1, MON, 900, 1030),
        section(20, 2, MON, 1000, 1130),
        section(21, 2, TUE, 1000, 1130),
      ];
      const groups = groupsFrom([[1], [2]], overlapping);
      const schedules = generateSchedules(groups, [], 2);

      assert.ok(schedules.length > 0);
      for (const schedule of schedules) {
        assert.equal(hasConflictInSchedule(schedule), false);
      }
    });

    test("accepts every subset when no course count is given", () => {
      const groups = groupsFrom([[1], [2]], sections);
      const schedules = generateSchedules([], groups, undefined);

      // Neither, each alone, or both: four subsets, all conflict-free here.
      assert.equal(schedules.length, 4);
    });
  });
});
