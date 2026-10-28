import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPlaceholderCourse,
  isPlaceholderCourse,
  PLACEHOLDER_SUBJECT,
} from "./placeholderUtils";
import {
  collectFulfilledNupaths,
  collectScheduleCourseCredits,
  isRequirementFulfilled,
} from "./requirementUtils";
import { creditsInAudit } from "./auditUtils";
import { Audit, AuditCourse, SeasonEnum, StatusEnum } from "./types";

const scheduleWithFall = (classes: AuditCourse[]): Audit => {
  const term = (season: SeasonEnum) => ({
    season,
    status: StatusEnum.CLASSES,
    id: null,
    classes: season === SeasonEnum.FL ? classes : [],
  });
  return {
    years: [
      {
        year: 1,
        fall: term(SeasonEnum.FL),
        spring: term(SeasonEnum.SP),
        summer1: term(SeasonEnum.S1),
        summer2: term(SeasonEnum.S2),
        isSummerFull: false,
      },
    ],
  };
};

test("placeholders use the chosen credits and are marked generic", () => {
  const course = createPlaceholderCourse({
    name: "General Elective",
    credits: 2,
  });
  assert.equal(course.subject, PLACEHOLDER_SUBJECT);
  assert.equal(course.numCreditsMin, 2);
  assert.equal(course.numCreditsMax, 2);
  assert.equal(course.generic, true);
  assert.deepEqual(course.nupaths, []);
  assert.ok(isPlaceholderCourse(course));
});

test("real courses are not placeholders", () => {
  assert.equal(
    isPlaceholderCourse({
      name: "Fundamentals of Computer Science 1",
      subject: "CS",
      classId: "2500",
      numCreditsMin: 4,
      numCreditsMax: 4,
      id: null,
    }),
    false,
  );
});

test("placeholders count toward credits and NUPaths", () => {
  const schedule = scheduleWithFall([
    createPlaceholderCourse({
      name: "Writing Intensive",
      credits: 4,
      nupath: "WI",
    }),
    createPlaceholderCourse({ name: "General Elective", credits: 4 }),
    createPlaceholderCourse({ name: "General Elective", credits: 1 }),
  ]);
  assert.equal(creditsInAudit(schedule), 9);
  assert.deepEqual([...collectFulfilledNupaths(schedule)], ["WI"]);
});

test("placeholders never fulfill a major requirement", () => {
  const schedule = scheduleWithFall([
    createPlaceholderCourse({ name: "CS Elective", credits: 4 }),
  ]);
  const credits = collectScheduleCourseCredits(schedule);
  assert.equal(
    isRequirementFulfilled(
      {
        type: "RANGE",
        subject: "CS",
        idRangeStart: 1000,
        idRangeEnd: 9999,
        exceptions: [],
      },
      credits,
    ),
    false,
  );
});
