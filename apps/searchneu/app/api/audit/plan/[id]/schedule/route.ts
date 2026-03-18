import { updateAuditPlan } from "@/lib/dal/audits";
import { UpdateAuditPlanDto } from "@/lib/graduate/api-dtos";
import { withAuth } from "@/lib/api/withAuth";

/**
 * Updates an audit plan schedule for the authenticated user
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
  const body = UpdateAuditPlanDto.safeParse(await req.json());
  if (!body.success)
    return Response.json(
      { error: "Invalid update audit plan schedule request" },
      { status: 400 },
    );
  const planId = parseInt(id, 10);
  if (Number.isNaN(planId))
    return Response.json({ error: "Invalid audit plan ID" }, { status: 400 });
  const result = await updateAuditPlan(body.data, planId, user.id);
  if (!result)
    return Response.json(
      { error: "Failed to update audit plan schedule" },
      { status: 400 },
    );
  return Response.json(result);
});
