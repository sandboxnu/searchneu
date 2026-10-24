import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAuditPlanCopy, createEmptySchedule } from "./auditPlanUtils";
import { AuditPlanRow } from "./types";

const plan = (overrides: Partial<AuditPlanRow> = {}): AuditPlanRow => ({
  id: 7,
  name: "My Plan",
  userId: "user-1",
  schedule: createEmptySchedule(),
  whiteboard: {
    "Core Requirements": { courses: ["CS-2500"], status: "in_progress" },
  },
  majors: ["Computer Science, BSCS"],
  minors: ["Mathematics Minor"],
  concentration: "Artificial Intelligence",
  catalogYear: 2025,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-02-01"),
  ...overrides,
});

test("buildAuditPlanCopy: names the copy after the original plan", () => {
  assert.equal(buildAuditPlanCopy(plan()).name, "Copy of My Plan");
});

test("buildAuditPlanCopy: keeps the schedule, whiteboard, and program info", () => {
  const original = plan();
  const copy = buildAuditPlanCopy(original);

  assert.deepEqual(copy.schedule, original.schedule);
  assert.deepEqual(copy.whiteboard, original.whiteboard);
  assert.deepEqual(copy.majors, original.majors);
  assert.deepEqual(copy.minors, original.minors);
  assert.equal(copy.concentration, original.concentration);
  assert.equal(copy.catalogYear, original.catalogYear);
});

test("buildAuditPlanCopy: leaves out the id, owner, and timestamps", () => {
  const copy = buildAuditPlanCopy(plan());

  assert.equal("id" in copy, false);
  assert.equal("userId" in copy, false);
  assert.equal("createdAt" in copy, false);
  assert.equal("updatedAt" in copy, false);
});

test("buildAuditPlanCopy: copies a plan with no majors or minors", () => {
  const copy = buildAuditPlanCopy(
    plan({
      majors: null,
      minors: null,
      concentration: null,
      catalogYear: null,
    }),
  );

  assert.equal(copy.majors, null);
  assert.equal(copy.minors, null);
  assert.equal(copy.concentration, null);
  assert.equal(copy.catalogYear, null);
});
