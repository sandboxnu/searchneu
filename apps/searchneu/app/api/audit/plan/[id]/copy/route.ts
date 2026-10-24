import { copyAuditPlan } from "@/lib/dal/audits";
import { withAuth } from "@/lib/api/withAuth";

/**
 * Copies an audit plan for the authenticated user into a new plan named
 * "Copy of <original name>"
 *
 * @param req the request object
 * @param params route parameter containing the ID of the plan to copy
 *
 * @returns 200 with the new audit plan object on success
 * @returns 401 if user is not authenticated
 * @returns 400 if the plan ID is invalid
 * @returns 404 if the plan doesn't exist or belongs to another user
 */
export const POST = withAuth<{ id: string }>(async (_req, user, { id }) => {
  const auditPlanId = parseInt(id, 10);
  if (isNaN(auditPlanId))
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  const result = await copyAuditPlan(auditPlanId, user.id);
  if (!result)
    return Response.json({ error: "Audit plan not found" }, { status: 404 });
  return Response.json(result);
});
