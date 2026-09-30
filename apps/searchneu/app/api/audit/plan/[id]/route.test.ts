import { test, mock, before } from "node:test";
import assert from "node:assert/strict";
import type { NextRequest } from "next/server";

const storedPlan = { id: 1, userId: "user-1", name: "My Plan" };

// the DAL is mocked so the route can be exercised without a database or auth
mock.module("../../../../../lib/dal/audits", {
  exports: {
    verifyUser: async () => ({ id: "user-1" }),
    getAuditPlan: async (id: number) =>
      id === storedPlan.id ? storedPlan : undefined,
    updateAuditPlan: async () => null,
    deleteAuditPlan: async () => null,
  },
});

let GET: typeof import("./route").GET;

before(async () => {
  ({ GET } = await import("./route"));
});

const get = (id: string) =>
  GET(new Request(`http://localhost/api/audit/plan/${id}`) as NextRequest, {
    params: Promise.resolve({ id }),
  });

test("GET /api/audit/plan/[id] returns the plan", async () => {
  const res = await get("1");

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), storedPlan);
});

test("GET /api/audit/plan/[id] returns 404 for a missing plan", async () => {
  const res = await get("99");

  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "Plan not found" });
});

test("GET /api/audit/plan/[id] returns 400 for a non-numeric id", async () => {
  const res = await get("abc");

  assert.equal(res.status, 400);
});
