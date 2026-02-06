import { NextRequest } from "next/server";
import {
  updateAuditPlan,
  deleteAuditPlan,
  verifyUser,
} from "@/app/graduate/lib/controllers/auditPlans";
import { UpdateAuditPlanDto } from "@/app/graduate/lib/api-dtos";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyUser();

  if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403
      });
  }

  const { id } = await params;
  const auditPlanId = parseInt(id);
  const body = await req.json();
  const updateReq = UpdateAuditPlanDto.safeParse(body);

  if (!updateReq.success) {
      return new Response(JSON.stringify({ error: "Invalid update audit plan request" }), {
          status: 400
      });
  }

  const updateResult = await updateAuditPlan(updateReq.data, auditPlanId, user.id);

  if (!updateResult) {
      return new Response(JSON.stringify({ error: "Failed to update audit plan" }), {
          status: 400
      });
  }

  return Response.json(updateResult);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyUser();

  if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403
      });
  }

  const { id } = await params;
  const auditPlanId = parseInt(id, 10);

  if (isNaN(auditPlanId)) {
      return new Response(JSON.stringify({ error: "Failed to delete audit plan" }), {
          status: 400
      });
  }
  const deleteResult = await deleteAuditPlan(auditPlanId, user.id);

  if(!deleteResult) {
      return new Response(JSON.stringify({ error: "Failed to delete audit plan" }), {
          status: 400
      });
  }

  return Response.json(deleteResult);
}
