import { NextRequest } from "next/server";
import { CreateAuditPlanDto } from "@/app/graduate/lib/api-dtos";
import {
  createAuditPlan,
  verifyUser,
} from "@/app/graduate/lib/controllers/auditPlans";

export async function POST(req: NextRequest) {
    const user = await verifyUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403
      });
    }
    const body = await req.json();
    const postReq = CreateAuditPlanDto.safeParse(body);

    if (!postReq.success) {
      return new Response(JSON.stringify({ error: "Invalid create audit plan request" }), {
        status: 400
      });
    }

    const plan = await createAuditPlan(postReq.data, user.id);

    if (!plan) {
      return new Response(JSON.stringify({ error: "Failed to create audit plan" }), {
        status: 400
      });
    }

    return Response.json(plan);
}