import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuditPlan, getAuditPlans } from "@/lib/dal/audits";
import { auth } from "@/lib/auth/auth";
import NotFound from "@/app/not-found";
import {
  Audit,
  AuditPlanRow,
  AuditPlanSummary,
  HydratedAuditPlan,
} from "@/lib/graduate/types";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { HeaderClient } from "@/components/graduate/HeaderClient";
import { PlanClient } from "@/components/graduate/PlanClient";

async function hydratePlan(
  row: AuditPlanRow,
): Promise<HydratedAuditPlan<null>> {
  const majors =
    row.majors && row.catalogYear
      ? await Promise.all(
          row.majors.map((m) => GraduateAPI.majors.get(row.catalogYear!, m)),
        )
      : [];

  const minors =
    row.minors && row.catalogYear
      ? await Promise.all(
          row.minors.map((m) => GraduateAPI.minors.get(row.catalogYear!, m)),
        )
      : [];

  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    schedule: row.schedule as Audit<null>,
    majors,
    minors,
    concentration: row.concentration,
    catalogYear: row.catalogYear ?? 2026,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
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
  const plan = await getAuditPlan(parseInt(planId), session.user.id);
  const userPlans: AuditPlanSummary[] = await getAuditPlans(session.user.id);

  if (!session.user.id) {
    return <h1> please sign in!</h1>;
  }
  if (!plan) {
    return <NotFound />;
  } else {
    return (
      <div>
        <h1> test</h1>
        <HeaderClient plans={userPlans} />
        <PlanClient plan={await hydratePlan(plan)} />
      </div>
    );
  }
}
