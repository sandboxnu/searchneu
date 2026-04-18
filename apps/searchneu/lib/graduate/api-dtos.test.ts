import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateAuditPlanDto, UpdateAuditPlanDto } from "./api-dtos";
import { SeasonEnum, StatusEnum } from "./types";

const validSchedule = {
  years: [
    {
      year: 1,
      fall: {
        season: SeasonEnum.FL,
        status: StatusEnum.CLASSES,
        classes: [
          {
            name: "Fundamentals of CS 1",
            classId: "2500",
            subject: "CS",
            numCreditsMin: 4,
            numCreditsMax: 4,
            id: null,
            nupaths: ["FQ"],
          },
        ],
        id: null,
      },
      spring: {
        season: SeasonEnum.SP,
        status: StatusEnum.CLASSES,
        classes: [],
        id: null,
      },
      summer1: {
        season: SeasonEnum.S1,
        status: StatusEnum.INACTIVE,
        classes: [],
        id: null,
      },
      summer2: {
        season: SeasonEnum.S2,
        status: StatusEnum.INACTIVE,
        classes: [],
        id: null,
      },
      isSummerFull: false,
    },
  ],
};

test("CreateAuditPlanDto: accepts a valid payload (matches what NewPlanModal POSTs)", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "My Plan",
    schedule: validSchedule,
    majors: ["Computer Science, BSCS"],
    minors: undefined,
    catalogYear: 2026,
    concentration: undefined,
  });
  assert.equal(result.success, true);
});

test("CreateAuditPlanDto: rejects an unknown extra field at the top level", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "X",
    schedule: validSchedule,
    bogus: 1,
  });
  assert.equal(result.success, false);
});

test("CreateAuditPlanDto: rejects schedule with malformed term (bad season)", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "X",
    schedule: {
      years: [
        {
          year: 1,
          fall: {
            season: "WINTER",
            status: StatusEnum.CLASSES,
            classes: [],
            id: null,
          },
          spring: validSchedule.years[0].spring,
          summer1: validSchedule.years[0].summer1,
          summer2: validSchedule.years[0].summer2,
          isSummerFull: false,
        },
      ],
    },
  });
  assert.equal(result.success, false);
});

test("CreateAuditPlanDto: rejects schedule with malformed course (missing classId)", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "X",
    schedule: {
      years: [
        {
          ...validSchedule.years[0],
          fall: {
            ...validSchedule.years[0].fall,
            classes: [
              {
                name: "x",
                subject: "CS",
                numCreditsMin: 4,
                numCreditsMax: 4,
                id: null,
              },
            ],
          },
        },
      ],
    },
  });
  assert.equal(result.success, false);
});

test("CreateAuditPlanDto: rejects schedule with non-object", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "X",
    schedule: "not a schedule",
  });
  assert.equal(result.success, false);
});

test("CreateAuditPlanDto: catalogYear out of range is rejected", () => {
  const result = CreateAuditPlanDto.safeParse({
    name: "X",
    schedule: validSchedule,
    catalogYear: 1500,
  });
  assert.equal(result.success, false);
});

test("UpdateAuditPlanDto: accepts schedule-only update (PlanClient PATCH)", () => {
  const result = UpdateAuditPlanDto.safeParse({ schedule: validSchedule });
  assert.equal(result.success, true);
});

test("UpdateAuditPlanDto: accepts whiteboard-only update (PlanClient whiteboard PATCH)", () => {
  const result = UpdateAuditPlanDto.safeParse({
    whiteboard: {
      "Foundation Courses": {
        courses: ["CS 2500", "CS 2510"],
        status: "in_progress",
      },
    },
  });
  assert.equal(result.success, true);
});

test("UpdateAuditPlanDto: rejects whiteboard with invalid status", () => {
  const result = UpdateAuditPlanDto.safeParse({
    whiteboard: {
      Section: { courses: [], status: "wat" },
    },
  });
  assert.equal(result.success, false);
});

test("UpdateAuditPlanDto: explicit null wipes are accepted (majors/minors/catalogYear/concentration)", () => {
  const result = UpdateAuditPlanDto.safeParse({
    majors: null,
    minors: null,
    catalogYear: null,
    concentration: null,
  });
  assert.equal(result.success, true);
});

test("UpdateAuditPlanDto: empty object is valid (no-op patch)", () => {
  const result = UpdateAuditPlanDto.safeParse({});
  assert.equal(result.success, true);
});

test("UpdateAuditPlanDto: rejects unknown extra field", () => {
  const result = UpdateAuditPlanDto.safeParse({ name: "x", oops: 1 });
  assert.equal(result.success, false);
});
