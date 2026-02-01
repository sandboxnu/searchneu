import { NextRequest } from "next/server";
import { createAuditPlan, verifyUser } from "../../lib/controllers/auditPlans";
import { CreateAuditPlanDto } from "../../lib/api-dtos";

export async function POST(req: NextRequest) {
    const user = await verifyUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" });
    }
    const body = await req.json();
    const postReq = CreateAuditPlanDto.safeParse(body);

    if (!postReq.success) {
      return Response.json( { error: "Invalid create plan request" } );
    }

    const plan = await createAuditPlan(postReq.data, user.id);

    if (!plan) {
        return Response.json({ error: "Failed to create plan" });
    }

    return Response.json(plan);
}