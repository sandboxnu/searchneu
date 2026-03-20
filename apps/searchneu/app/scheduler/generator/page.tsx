import { SchedulerWrapper } from "@/components/scheduler/generator/SchedulerWrapper";
import { getTerms } from "@/lib/dal/terms";
import { getCampuses } from "@/lib/dal/campuses";
import { getNupaths } from "@/lib/dal/nupaths";

import { db, nupathsT, savedPlansT, savedPlanCoursesT } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    planId: string;
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const planId = params.planId ? parseInt(params.planId) : null;

  if (!planId || isNaN(planId)) {
    return <div>Invalid or missing plan ID</div>;
  }

  let plan;

  try {
    plan = await db.query.savedPlansT.findFirst({
      where: and(
        eq(savedPlansT.id, planId),
        eq(savedPlansT.userId, session.user.id),
      ),
    });
    if (!plan) {
      return <div>Plan not found</div>;
    }
  } catch (error) {
    console.error("Error loading plan:", error);
    return <div>Error loading plan</div>;
  }

  // Fetch available NUPath options
  const nupathOptions = await db
    .selectDistinct({ short: nupathsT.short, name: nupathsT.name })
    .from(nupathsT)
    .then((c) => c.map((e) => ({ label: e.name, value: e.short })));

  // Fetch terms from the db
  const terms = await getTerms();

  // Fetch campuses for the mapping
  const campuses = await getCampuses();

  // Fetch nupaths for the mapping
  const nupaths = await getNupaths();

  return (
    <div className="bg-secondary h-full w-full px-4 pt-4 xl:px-6">
      <SchedulerWrapper
        nupathOptions={nupathOptions}
        terms={terms}
        campuses={campuses}
        nupaths={nupaths}
      />
    </div>
  );
}
