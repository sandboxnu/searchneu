import { NextRequest } from "next/server";
import { CreateAuditPlanDto } from "@/lib/graduate/api-dtos";
import {
  createAuditPlan,
  verifyUser,
  getAuditPlans,
} from "@/lib/controllers/auditPlans";

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
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const body = await req.json();
    const postReq = CreateAuditPlanDto.safeParse(body);

    if (!postReq.success) {
      return new Response(
        JSON.stringify({ error: "Invalid create audit plan request" }),
        {
          status: 400,
        },
      );
    }

    const plan = await createAuditPlan(postReq.data, user.id);

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Failed to create audit plan" }),
        {
          status: 400,
        },
      );
    }

    return Response.json(plan);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({ error: `Failed to create audit plan: ${message}` }),
      { status: 400 },
    );
  }
}

/**
 * Gets an audit plan for the authenticated user
 *
 * @param req the request (we need the cookie)
 * @param params route parameter containing the audit plan ID
 *
 * @returns 200 with the audit plan object
 * @returns 403 if user is not authenticated
 * @returns 400 if db fetch fails
 */
export async function GET() {
  try {
    const user = await verifyUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    const planResult = await getAuditPlans(user.id);
    return Response.json(planResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({ error: `Failed to fetch audit plan: ${message}` }),
      { status: 400 },
    );
  }
}
