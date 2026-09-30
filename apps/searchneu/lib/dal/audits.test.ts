import { test, mock, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as schema from "@sneu/db/schema";
import type { UpdateAuditPlanInput } from "../graduate/api-dtos";
import { Audit, SeasonEnum, StatusEnum, Whiteboard } from "../graduate/types";

// updateAuditPlan talks to the database and the majors controller, so both
// are swapped for in-memory fakes. auth is mocked because it pulls in
// "server-only", which can't be imported outside of Next.
const storedPlan = {
  id: 1,
  userId: "user-1",
  name: "My Plan",
  schedule: { years: [] } as Audit,
  majors: ["Computer Science, BSCS"],
  minors: ["Mathematics Minor"],
  concentration: "Artificial Intelligence",
  catalogYear: 2025,
  whiteboard: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

let currentPlan: typeof storedPlan | undefined;
let writes: Record<string, unknown>[];
let majorIsValid: boolean;

const fakeDb = {
  query: {
    auditPlansT: { findFirst: async () => currentPlan },
  },
  update: () => ({
    set: (values: Record<string, unknown>) => {
      writes.push(values);
      return {
        where: () => ({
          returning: async () => [{ ...currentPlan, ...values }],
        }),
      };
    },
  }),
};

mock.module("../db", { exports: { ...schema, db: fakeDb } });
mock.module("../auth/auth", { exports: { auth: {} } });
mock.module("../controllers/majors", {
  exports: {
    getByMajorAndYear: async () => ({}),
    getByMinorAndYear: async () => ({}),
    isMajorInYear: async () => majorIsValid,
    isValidConcentrationForMajor: async () => true,
  },
});

let updateAuditPlan: typeof import("./audits").updateAuditPlan;

before(async () => {
  ({ updateAuditPlan } = await import("./audits"));
});

const newSchedule: Audit = {
  years: [
    {
      year: 1,
      fall: {
        season: SeasonEnum.FL,
        status: StatusEnum.CLASSES,
        classes: [],
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

const update = (input: UpdateAuditPlanInput) =>
  updateAuditPlan(input, storedPlan.id, storedPlan.userId);

beforeEach(() => {
  currentPlan = { ...storedPlan };
  writes = [];
  majorIsValid = true;
});

test("updateAuditPlan: schedule only replaces the schedule and keeps majors", async () => {
  const result = await update({ schedule: newSchedule });

  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].schedule, newSchedule);
  assert.deepEqual(writes[0].majors, storedPlan.majors);
  assert.deepEqual(writes[0].minors, storedPlan.minors);
  assert.equal(writes[0].catalogYear, storedPlan.catalogYear);
  assert.deepEqual(result?.schedule, newSchedule);
});

test("updateAuditPlan: major update writes the new major info", async () => {
  await update({
    majors: ["Data Science, BS"],
    catalogYear: 2025,
    concentration: "",
  });

  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].majors, ["Data Science, BS"]);
  assert.equal(writes[0].catalogYear, 2025);
  // same catalog year, so minors are kept
  assert.deepEqual(writes[0].minors, storedPlan.minors);
});

test("updateAuditPlan: changing the catalog year clears minors", async () => {
  await update({ majors: storedPlan.majors, catalogYear: 2024 });

  assert.equal(writes.length, 1);
  assert.equal(writes[0].catalogYear, 2024);
  assert.equal(writes[0].minors, null);
});

test("updateAuditPlan: invalid major for the catalog year is rejected without a write", async () => {
  majorIsValid = false;

  const result = await update({ majors: ["Not A Major"], catalogYear: 2025 });

  assert.equal(result, null);
  assert.equal(writes.length, 0);
});

test("updateAuditPlan: null minors wipes the minor and keeps the major", async () => {
  await update({ minors: null });

  assert.equal(writes.length, 1);
  assert.equal(writes[0].minors, null);
  assert.deepEqual(writes[0].majors, storedPlan.majors);
  assert.equal(writes[0].concentration, storedPlan.concentration);
});

test("updateAuditPlan: whiteboard only is saved", async () => {
  const whiteboard: Whiteboard = {
    "Core Requirements": { courses: ["CS-2500"], status: "in_progress" },
  };

  // PlanClient saves the whiteboard on its own, so this must still persist
  await update({ whiteboard });

  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].whiteboard, whiteboard);
});

test("updateAuditPlan: no-op returns the plan unchanged without writing", async () => {
  const result = await update({});

  assert.equal(writes.length, 0);
  assert.deepEqual(result, storedPlan);
});

test("updateAuditPlan: missing plan returns null without writing", async () => {
  currentPlan = undefined;

  const result = await update({ name: "Renamed" });

  assert.equal(result, null);
  assert.equal(writes.length, 0);
});
