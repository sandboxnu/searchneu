import { ClientAuditPlan } from "@/components/graduate/PlanClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Major, Minor } from "@/lib/graduate/types";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { AuditClient } from "@/components/graduate/AuditClient";
import { getAuditPlan } from "@/lib/controllers/auditPlans";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getMajors(
  majors: string[],
  catalogYear: number,
): Promise<Major[]> {
  const majorsWithData = await Promise.all(
    majors.map(async (major) => {
      return GraduateAPI.majors.get(catalogYear, major);
    }),
  );
  return majorsWithData;
}

async function getMinors(
  minors: string[],
  catalogYear: number,
): Promise<Minor[]> {
  const minorsWithData = await Promise.all(
    minors.map(async (minor) => {
      return GraduateAPI.minors.get(catalogYear, minor);
    }),
  );
  return minorsWithData;
}

async function getPlan(planId: number): Promise<ClientAuditPlan> {
  const cookieStore = await cookies();
  const planRes = await fetch(`${baseUrl}/api/audit/plan/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    credentials: "include",
  });
  const planJson = await planRes.json();
  // get major data
  if (planJson.majors) {
    planJson.majors = await getMajors(
      planJson.majors,
      parseInt(planJson.catalogYear),
    );
  }
  //get minor data
  if (planJson.minors) {
    planJson.minors = await getMinors(
      planJson.minors,
      parseInt(planJson.catalogYear),
    );
  }

  const plan = planJson as ClientAuditPlan;
  return plan;
}

async function getPlans(): Promise<ClientAuditPlan[]> {
  const cookieStore = await cookies();
  const plansRes = await fetch(`${baseUrl}/api/audit/plan`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    credentials: "include",
  });
  if (!plansRes.ok) {
    console.error("Failed to fetch plans:", plansRes.status);
  }
  //const data = await res.json();
  const data = await plansRes.json();
  //console.log("Type of data:", data);
  return data;
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const planId = (await params).planId;
  const plan = await getAuditPlan(parseInt(session.user.id),planId);


    // get major data
    if (plan.majors) {
      planJson.majors = await getMajors(
        planJson.majors,
        parseInt(planJson.catalogYear),
      );
    }
    //get minor data
    if (planJson.minors) {
      planJson.minors = await getMinors(
        planJson.minors,
        parseInt(planJson.catalogYear),
      );
    }


  const userPlans = await getPlans();
  //const data = await res.json();

  if (!session.user.id) {
    return <h1> please sign in!</h1>;
  }
  if (!plan) {
    return (
      <h1>
        {" "}
        no schedule found: {planId} {JSON.stringify(session.user)} DENNIS={" "}
        {JSON.stringify(plan)}
      </h1>
    );
  } else {
    return <AuditClient plan={plan} plans={userPlans} />;
  }
}
