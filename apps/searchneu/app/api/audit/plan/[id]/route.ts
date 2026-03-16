import {
  updateAuditPlan,
  deleteAuditPlan,
  getAuditPlan,
} from "@/lib/dal/audits";
import { UpdateAuditPlanDto } from "@/lib/graduate/api-dtos";
import { withAuth } from "@/lib/api/withAuth";

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
export const PATCH = withAuth<{ id: string }>(async (req, user, { id }) => {
  const auditPlanId = parseInt(id, 10);
  if (isNaN(auditPlanId))
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  const body = UpdateAuditPlanDto.safeParse(await req.json());
  if (!body.success)
    return Response.json({ error: "Invalid request" }, { status: 400 });
  const result = await updateAuditPlan(body.data, auditPlanId, user.id);
  if (!result)
    return Response.json({ error: "Failed to update" }, { status: 400 });
  return Response.json(result);
});

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
export const DELETE = withAuth<{ id: string }>(async (_req, user, { id }) => {
  const auditPlanId = parseInt(id, 10);
  if (isNaN(auditPlanId))
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  const result = await deleteAuditPlan(auditPlanId, user.id);
  if (!result)
    return Response.json(
      { error: "Failed to delete audit plan" },
      { status: 400 },
    );
  return Response.json(result);
});

/**
 * Gets an audit plan for the authenticated user
 *
 * @param req the request (we need the cookie)
 * @param params route parameter containing the audit plan ID
 *
 * @returns 200 with the audit plan object
 * @returns 401 if user is not authenticated
 * @returns 400 if db fetch fails
 */
export const GET = withAuth<{ id: string }>(async (_req, user, { id }) => {
  const auditPlanId = parseInt(id, 10);
  if (isNaN(auditPlanId))
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  const plan = await getAuditPlan(auditPlanId, user.id);
  return Response.json(plan);
});
