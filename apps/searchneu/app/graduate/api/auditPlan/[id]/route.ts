import { NextRequest } from "next/server";
import {
  updateAuditPlan,
  deleteAuditPlan,
  verifyUser,
} from "@/app/graduate/lib/controllers/auditPlans";
import { UpdateAuditPlanDto } from "@/app/graduate/lib/api-dtos";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" });
  }

  const auditPlanId = parseInt(params.id);
  const body = await req.json();
  const updateReq = UpdateAuditPlanDto.safeParse(body);

  if (!updateReq.success) {
    return Response.json( { error: "Invalid update request" } );
  }

  const updateResult = await updateAuditPlan(updateReq.data, auditPlanId, user.id);

  if (!updateResult) {
    return Response.json({ error: "Bad Request" });
  }

  return Response.json(updateResult);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" });
  }

  const auditPlanId = parseInt(params.id);
  const deleteResult = await deleteAuditPlan(auditPlanId, user.id);

  if(!deleteResult) {
    return Response.json({ error: "Bad Request" });
  }
}
