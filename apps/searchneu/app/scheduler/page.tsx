import { DashboardClient } from "@/components/scheduler/dashboard/Dashboard";
import { auth } from "@/lib/auth/auth";
import { getCampuses } from "@/lib/dal/campuses";
import { getNupaths } from "@/lib/dal/nupaths";
import { getTerms } from "@/lib/dal/terms";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

const cachedCampuses = unstable_cache(getCampuses, [], {
  revalidate: 3600,
  tags: ["banner.campuses"],
});

const cachedNupaths = unstable_cache(getNupaths, [], {
  revalidate: 3600,
  tags: ["banner.nupaths"],
});

export default async function Dashboard() {
  const terms = getTerms();
  const campuses = cachedCampuses();
  const nupaths = cachedNupaths();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <DashboardClient
      termsPromise={terms}
      campusesPromise={campuses}
      nupathsPromise={nupaths}
      isLoggedIn={!!session}
    />
  );
}
