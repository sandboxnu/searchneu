import { SchedulerWrapper } from "@/components/scheduler/generator/SchedulerWrapper";
import { auth } from "@/lib/auth/auth";
import { getCampuses } from "@/lib/dal/campuses";
import { getNupaths } from "@/lib/dal/nupaths";
import { getTerms } from "@/lib/dal/terms";
import { db, nupathsT } from "@/lib/db";
import { headers } from "next/headers";

export default async function Page() {
  const [session, nupathOptions, terms, campuses, nupaths] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db
      .selectDistinct({ short: nupathsT.short, name: nupathsT.name })
      .from(nupathsT)
      .then((c) => c.map((e) => ({ label: e.name, value: e.short }))),
    getTerms(),
    getCampuses(),
    getNupaths(),
  ]);

  return (
    <div className="bg-secondary h-full w-full px-4 pt-4 xl:px-6">
      <SchedulerWrapper
        nupathOptions={nupathOptions}
        terms={terms}
        campuses={campuses}
        nupaths={nupaths}
        isLoggedIn={!!session?.user?.id}
      />
    </div>
  );
}
