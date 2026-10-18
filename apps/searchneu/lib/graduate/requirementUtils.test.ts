import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWhiteboardFromSchedule,
  pruneWhiteboard,
  collectRequiredCourseKeys,
} from "./requirementUtils";
import { Audit, Section, SeasonEnum, StatusEnum, Whiteboard } from "./types";

const term = (
  season: SeasonEnum,
  classes: { subject: string; classId: string }[] = [],
) => ({
  season,
  status: StatusEnum.CLASSES,
  id: null,
  classes: classes.map((c) => ({
    name: "",
    subject: c.subject,
    classId: c.classId,
    numCreditsMin: 4,
    numCreditsMax: 4,
    id: null,
  })),
});

const scheduleWith = (
  courses: { subject: string; classId: string }[],
): Audit => ({
  years: [
    {
      year: 1,
      fall: term(SeasonEnum.FL, courses),
      spring: term(SeasonEnum.SP),
      summer1: term(SeasonEnum.S1),
      summer2: term(SeasonEnum.S2),
      isSummerFull: false,
    },
  ],
});

const sectionWithCourses = (
  title: string,
  courses: { subject: string; classId: number }[],
): Section => ({
  type: "SECTION",
  title,
  minRequirementCount: courses.length,
  requirements: courses.map((c) => ({
    type: "COURSE",
    subject: c.subject,
    classId: c.classId,
  })),
});

test("collectRequiredCourseKeys: flattens AND/OR/XOM/SECTION trees", () => {
  const keys = collectRequiredCourseKeys({
    type: "AND",
    courses: [
      { type: "COURSE", subject: "CS", classId: 2500 },
      {
        type: "OR",
        courses: [
          { type: "COURSE", subject: "CS", classId: 2510 },
          {
            type: "SECTION",
            title: "nested",
            minRequirementCount: 1,
            requirements: [{ type: "COURSE", subject: "MATH", classId: 1341 }],
          },
        ],
      },
    ],
  });
  assert.deepEqual(keys.sort(), ["CS 2500", "CS 2510", "MATH 1341"].sort());
});

test("buildWhiteboardFromSchedule (fresh): matches set in_progress, unmatched set not_started", () => {
  const sections = [
    sectionWithCourses("Foundations", [
      { subject: "CS", classId: 2500 },
      { subject: "CS", classId: 2510 },
    ]),
    sectionWithCourses("Math", [{ subject: "MATH", classId: 1341 }]),
  ];
  const schedule = scheduleWith([{ subject: "CS", classId: "2500" }]);
  const wb = buildWhiteboardFromSchedule(sections, schedule);
  assert.deepEqual(wb.Foundations, {
    courses: ["CS 2500"],
    status: "in_progress",
  });
  assert.deepEqual(wb.Math, { courses: [], status: "not_started" });
});

test("buildWhiteboardFromSchedule (merge): preserves existing courses + completed status", () => {
  const sections = [
    sectionWithCourses("Foundations", [
      { subject: "CS", classId: 2500 },
      { subject: "CS", classId: 2510 },
    ]),
  ];
  const schedule = scheduleWith([{ subject: "CS", classId: "2500" }]);
  const current: Whiteboard = {
    Foundations: { courses: ["CS 9999"], status: "completed" },
  };
  const wb = buildWhiteboardFromSchedule(sections, schedule, current);
  // Manual courses kept, matched added, status preserved as completed
  assert.deepEqual(wb.Foundations, {
    courses: ["CS 9999", "CS 2500"],
    status: "completed",
  });
});

test("buildWhiteboardFromSchedule (merge): not_started auto-upgrades to in_progress when match appears", () => {
  const sections = [
    sectionWithCourses("S", [{ subject: "CS", classId: 2500 }]),
  ];
  const schedule = scheduleWith([{ subject: "CS", classId: "2500" }]);
  const current: Whiteboard = {
    S: { courses: [], status: "not_started" },
  };
  const wb = buildWhiteboardFromSchedule(sections, schedule, current);
  assert.equal(wb.S.status, "in_progress");
});

test("pruneWhiteboard: removes whiteboard courses no longer in schedule", () => {
  const schedule = scheduleWith([{ subject: "CS", classId: "2500" }]);
  const wb: Whiteboard = {
    Foundations: { courses: ["CS 2500", "CS 9999"], status: "in_progress" },
  };
  const pruned = pruneWhiteboard(schedule, wb);
  assert.deepEqual(pruned, {
    Foundations: { courses: ["CS 2500"], status: "in_progress" },
  });
});

test("pruneWhiteboard: returns null when nothing was removed (caller can skip persist)", () => {
  const schedule = scheduleWith([{ subject: "CS", classId: "2500" }]);
  const wb: Whiteboard = {
    Foundations: { courses: ["CS 2500"], status: "in_progress" },
  };
  assert.equal(pruneWhiteboard(schedule, wb), null);
});
