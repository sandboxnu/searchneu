import { NextRequest } from "next/server";
import {
  updateAuditPlan,
  deleteAuditPlan,
  verifyUser,
} from "@/lib/controllers/auditPlans";
import { UpdateAuditPlanDto } from "@/lib/graduate/api-dtos";

/**
 * Updates an audit plan for the authenticated user
 *
 *
 * @param req the request object containing
 * the updated plan data in the body
 * @param params route parameter containing the audit plan ID
 *
 * @returns 200 with the updated audit plan object on success
 * @returns 401 if user is not authenticated
 * @returns 400 if request body is invalid or plan update fails
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;
    const auditPlanId = parseInt(id, 10);
    const body = await req.json();
    const updateReq = UpdateAuditPlanDto.safeParse(body);

    if (!updateReq.success) {
      return new Response(
        JSON.stringify({ error: "Invalid update audit plan request" }),
        {
          status: 400,
        },
      );
    }

    const updateResult = await updateAuditPlan(
      updateReq.data,
      auditPlanId,
      user.id,
    );

    if (!updateResult) {
      return new Response(
        JSON.stringify({ error: "Failed to update audit plan" }),
        {
          status: 400,
        },
      );
    }

    return Response.json(updateResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({ error: `Failed to update audit plan: ${message}` }),
      { status: 400 },
    );
  }
}

/**
 * Deletes an audit plan for the authenticated user
 *
 * @param req the request object
 * @param params route parameter containing the audit plan ID
 *
 * @returns 200 with the deleted audit plan object on success
 * @returns 401 if user is not authenticated
 * @returns 400 if deletion fails
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    const { id } = await params;
    const auditPlanId = parseInt(id, 10);

    if (isNaN(auditPlanId)) {
      return new Response(
        JSON.stringify({ error: "Failed to delete audit plan" }),
        {
          status: 400,
        },
      );
    }

    const deleteResult = await deleteAuditPlan(auditPlanId, user.id);

    if (!deleteResult) {
      return new Response(
        JSON.stringify({ error: "Failed to delete audit plan" }),
        {
          status: 400,
        },
      );
    }

    return Response.json(deleteResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({ error: `Failed to create audit plan: ${message}` }),
      { status: 400 },
    );
  }
}
