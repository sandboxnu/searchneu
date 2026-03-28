"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { deleteAuditPlan } from "@/lib/dal/audits";

type ActionResult = { ok: true } | { ok: false; msg: string };

export async function deletePlanAction(planId: number): Promise<ActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, msg: "No valid session" };
  }

  const result = await deleteAuditPlan(planId, session.user.id);

  if (!result) {
    return { ok: false, msg: "Plan not found or not authorized" };
  }

  return { ok: true };
}
