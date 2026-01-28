import { NextRequest } from "next/server";
import { getGuid } from "@/lib/auth/utils";
import { createAuditPlan } from "../../lib/controllers/plans";
import { CreatePlanInput } from "../../lib/api-dtos";
import { db, usersT } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const guid = await getGuid();

    if (!guid) {
      return Response.json({ error: "Unauthorized" });
    }

  const users = await db
    .select({
      id: usersT.id
    })
    .from(usersT)
    .where(eq(usersT.guid, guid));
    const user = users[0];

    if (!user) {
        return Response.json({ error: "Unauthorized" });
    }

    const body: CreatePlanInput = await req.json();
    const plan = await createAuditPlan(body, user.id);

    if (!plan) {
        return Response.json({ error: "Failed to create plan" });
    }

    return Response.json(plan);
}