import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import { auth } from "@/lib/auth/auth";
import { getAuditPlans } from "@/lib/dal/audits";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    const plans = await getAuditPlans(session.user.id);
    if (plans.length > 0) {
      const lastModified = plans.reduce((latest, plan) =>
        plan.updatedAt > latest.updatedAt ? plan : latest,
      );
      redirect(`/graduate/${lastModified.id}`);
    }
    return (
      <div>
        <NewPlanModal isGuest={false} />
      </div>
    );
  }

  // Guests are handled by /graduate/guest; keep the query string so the
  // plan's majors, minors, and catalog year carry over.
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v) query.append(key, v);
    }
  }
  const queryString = query.toString();
  redirect(`/graduate/guest${queryString ? `?${queryString}` : ""}`);
}
