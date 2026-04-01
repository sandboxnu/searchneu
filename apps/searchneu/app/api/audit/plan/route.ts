import { CreateAuditPlanDto } from "@/lib/graduate/api-dtos";
import { createAuditPlan, getAuditPlans } from "@/lib/dal/audits";
import { withAuth } from "@/lib/api/withAuth";

/**
 * Creates a new audit plan for the authenticated user
 *
 *
 * @param req the request object containing the plan data in the body
 *
 * @returns 200 with the created audit plan object on success
 * @returns 401 if user is not authenticated
 * @returns 400 if request body is invalid or plan creation fails
 */
export const POST = withAuth(async (req, user) => {
  const body = CreateAuditPlanDto.safeParse(await req.json());
  if (!body.success)
    return Response.json(
      { error: "Invalid create audit plan request" },
      { status: 400 },
    );
  const plan = await createAuditPlan(body.data, user.id);
  if (!plan)
    return Response.json(
      { error: "Failed to create audit plan" },
      { status: 400 },
    );
  return Response.json(plan);
});

/**
 * Gets all plans belonging to the authenticated user
 *
 *
 * @param req with headers
 *
 * @returns 200 with the fetched plans
 * @returns 401 if user is not authenticated
 */
export const GET = withAuth(async (_req, user) => {
  const plans = await getAuditPlans(user.id);
  return Response.json(plans);
});
