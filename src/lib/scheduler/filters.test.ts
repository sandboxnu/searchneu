import { describe, test } from "node:test";
import assert from "node:assert";
import {
  sectionPassesFilters,
  schedulePassesFilters,
  filterSchedules,
  SectionWithCourse,
  ScheduleFilters,
} from "./filters";

describe("filters", () => {
  const createMockSection = (
    overrides: Partial<SectionWithCourse> = {}
  ): SectionWithCourse => ({
    id: 1,
    crn: "10001",
    faculty: "Smith, John",
    campus: "Boston",
    honors: false,
    classType: "Lecture",
    seatRemaining: 10,
    seatCapacity: 30,
    waitlistCapacity: 5,
    waitlistRemaining: 0,
    courseName: "Introduction to Computer Science",
    courseSubject: "CS",
    courseNumber: "2500",
    courseNupaths: ["ND"],
    meetingTimes: [
      {
        days: [1, 3], // Monday, Wednesday
        startTime: 900, // 9:00 AM
        endTime: 1030, // 10:30 AM
        final: false,
      },
    ],
    ...overrides,
  });

  describe("sectionPassesFilters", () => {
    test("should return true when no filters provided", () => {
      const section = createMockSection();
      const filters: ScheduleFilters = {};
      assert.strictEqual(sectionPassesFilters(section, filters), true);
    });

    test("should filter by startTime", () => {
      const section = createMockSection({
        meetingTimes: [
          {
            days: [1, 3],
            startTime: 900,
            endTime: 1030,
            final: false,
          },
        ],
      });

      // Section starts at 9:00 AM, filter allows 8:00 AM+
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 800 }),
        true
      );

      // Section starts at 9:00 AM, filter requires 10:00 AM+
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 1000 }),
        false
      );
    });

    test("should filter by endTime", () => {
      const section = createMockSection({
        meetingTimes: [
          {
            days: [1, 3],
            startTime: 900,
            endTime: 1030,
            final: false,
          },
        ],
      });

      // Section ends at 10:30 AM, filter allows up to 11:00 AM
      assert.strictEqual(
        sectionPassesFilters(section, { endTime: 1100 }),
        true
      );

      // Section ends at 10:30 AM, filter requires ending before 10:00 AM
      assert.strictEqual(
        sectionPassesFilters(section, { endTime: 1000 }),
        false
      );
    });

    test("should filter by startTime and endTime together", () => {
      const section = createMockSection({
        meetingTimes: [
          {
            days: [1, 3],
            startTime: 900,
            endTime: 1030,
            final: false,
          },
        ],
      });

      // Section is 9:00-10:30, filter allows 8:00-11:00
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 800, endTime: 1100 }),
        true
      );

      // Section is 9:00-10:30, filter requires 10:00-11:00
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 1000, endTime: 1100 }),
        false
      );
    });

    test("should filter by specificDaysFree", () => {
      const section = createMockSection({
        meetingTimes: [
          {
            days: [1, 3], // Monday, Wednesday
            startTime: 900,
            endTime: 1030,
            final: false,
          },
        ],
      });

      // Section has classes on Monday/Wednesday, filter requires Tuesday free
      assert.strictEqual(
        sectionPassesFilters(section, { specificDaysFree: [2] }),
        true
      );

      // Section has classes on Monday/Wednesday, filter requires Monday free
      assert.strictEqual(
        sectionPassesFilters(section, { specificDaysFree: [1] }),
        false
      );

      // Section has classes on Monday/Wednesday, filter requires both Monday and Wednesday free
      assert.strictEqual(
        sectionPassesFilters(section, { specificDaysFree: [1, 3] }),
        false
      );
    });

    test("should filter by minSeatsLeft", () => {
      const section = createMockSection({
        seatRemaining: 10,
      });

      // Section has 10 seats, filter requires at least 5
      assert.strictEqual(
        sectionPassesFilters(section, { minSeatsLeft: 5 }),
        true
      );

      // Section has 10 seats, filter requires at least 15
      assert.strictEqual(
        sectionPassesFilters(section, { minSeatsLeft: 15 }),
        false
      );
    });

    test("should handle sections with multiple meeting times", () => {
      const section = createMockSection({
        meetingTimes: [
          {
            days: [1],
            startTime: 900,
            endTime: 1030,
            final: false,
          },
          {
            days: [3],
            startTime: 1100,
            endTime: 1230,
            final: false,
          },
        ],
      });

      // First meeting is 9:00-10:30, second is 11:00-12:30
      // Filter requires start at 8:00+ (both pass)
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 800 }),
        true
      );

      // Filter requires start at 10:00+ (first fails)
      assert.strictEqual(
        sectionPassesFilters(section, { startTime: 1000 }),
        false
      );
    });
  });

  describe("schedulePassesFilters", () => {
    test("should return true when no filters provided", () => {
      const schedule = [createMockSection()];
      const filters: ScheduleFilters = {};
      assert.strictEqual(schedulePassesFilters(schedule, filters), true);
    });

    test("should filter by minDaysFree", () => {
      const schedule = [
        createMockSection({
          meetingTimes: [
            {
              days: [1, 3], // Monday, Wednesday
              startTime: 900,
              endTime: 1030,
              final: false,
            },
          ],
        }),
        createMockSection({
          id: 2,
          crn: "20001",
          meetingTimes: [
            {
              days: [2, 4], // Tuesday, Thursday
              startTime: 1100,
              endTime: 1230,
              final: false,
            },
          ],
        }),
      ];

      // Schedule uses Mon, Tue, Wed, Thu (4 days)
      // Filter requires at least 3 free days (7 - 4 = 3 free)
      assert.strictEqual(
        schedulePassesFilters(schedule, { minDaysFree: 3 }),
        true
      );

      // Filter requires at least 4 free days (7 - 4 = 3 free, fails)
      assert.strictEqual(
        schedulePassesFilters(schedule, { minDaysFree: 4 }),
        false
      );
    });

    test("should filter by minHonorsCourses", () => {
      const schedule = [
        createMockSection({ honors: true }),
        createMockSection({ id: 2, crn: "20001", honors: true }),
        createMockSection({ id: 3, crn: "30001", honors: false }),
      ];

      // Schedule has 2 honors courses, filter requires at least 2
      assert.strictEqual(
        schedulePassesFilters(schedule, { minHonorsCourses: 2 }),
        true
      );

      // Schedule has 2 honors courses, filter requires at least 3
      assert.strictEqual(
        schedulePassesFilters(schedule, { minHonorsCourses: 3 }),
        false
      );
    });

    test("should filter by nupaths", () => {
      const schedule = [
        createMockSection({ courseNupaths: ["ND", "AD"] }),
        createMockSection({
          id: 2,
          crn: "20001",
          courseNupaths: ["EI"],
        }),
      ];

      // Schedule has ND, AD, EI, filter requires ND and AD
      assert.strictEqual(
        schedulePassesFilters(schedule, { nupaths: ["ND", "AD"] }),
        true
      );

      // Schedule has ND, AD, EI, filter requires ND, AD, and FQ (missing FQ)
      assert.strictEqual(
        schedulePassesFilters(schedule, { nupaths: ["ND", "AD", "FQ"] }),
        false
      );
    });

    test("should check individual section filters first", () => {
      const schedule = [
        createMockSection({
          seatRemaining: 5,
        }),
      ];

      // Section has 5 seats, but filter requires 10
      assert.strictEqual(
        schedulePassesFilters(schedule, { minSeatsLeft: 10 }),
        false
      );
    });

    test("should combine multiple filters", () => {
      const schedule = [
        createMockSection({
          honors: true,
          seatRemaining: 10,
          meetingTimes: [
            {
              days: [1, 3],
              startTime: 900,
              endTime: 1030,
              final: false,
            },
          ],
        }),
      ];

      // All filters pass
      assert.strictEqual(
        schedulePassesFilters(schedule, {
          minSeatsLeft: 5,
          minHonorsCourses: 1,
          startTime: 800,
        }),
        true
      );

      // One filter fails
      assert.strictEqual(
        schedulePassesFilters(schedule, {
          minSeatsLeft: 15, // fails
          minHonorsCourses: 1,
          startTime: 800,
        }),
        false
      );
    });
  });

  describe("filterSchedules", () => {
    test("should filter multiple schedules", () => {
      const schedules = [
        [
          createMockSection({
            seatRemaining: 10,
          }),
        ],
        [
          createMockSection({
            id: 2,
            crn: "20001",
            seatRemaining: 5,
          }),
        ],
        [
          createMockSection({
            id: 3,
            crn: "30001",
            seatRemaining: 15,
          }),
        ],
      ];

      const filters: ScheduleFilters = { minSeatsLeft: 10 };
      const filtered = filterSchedules(schedules, filters);

      // Only schedules with at least 10 seats should remain
      assert.strictEqual(filtered.length, 2);
      assert.strictEqual(filtered[0][0].seatRemaining, 10);
      assert.strictEqual(filtered[1][0].seatRemaining, 15);
    });

    test("should return empty array when no schedules pass filters", () => {
      const schedules = [
        [createMockSection({ seatRemaining: 5 })],
        [createMockSection({ id: 2, crn: "20001", seatRemaining: 3 })],
      ];

      const filters: ScheduleFilters = { minSeatsLeft: 10 };
      const filtered = filterSchedules(schedules, filters);

      assert.strictEqual(filtered.length, 0);
    });

    test("should return all schedules when filters are empty", () => {
      const schedules = [
        [createMockSection()],
        [createMockSection({ id: 2, crn: "20001" })],
      ];

      const filters: ScheduleFilters = {};
      const filtered = filterSchedules(schedules, filters);

      assert.strictEqual(filtered.length, 2);
    });
  });
});

