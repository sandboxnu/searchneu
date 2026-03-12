import { type ReactNode } from "react";
import { getTerms } from "@/lib/dal/terms";
import { MobileWrapper } from "@/components/catalog/MobileWrapper";
import { db, sectionsT } from "@/lib/db";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getSubjects } from "@/lib/dal/subjects";
import { getCampuses } from "@/lib/dal/campuses";
import { getNupaths } from "@/lib/dal/nupaths";

const cachedSubjects = unstable_cache(async () => getSubjects(), [], {
  revalidate: 3600,
  tags: ["banner.subjects"],
});

const cachedCampuses = unstable_cache(async () => getCampuses(), [], {
  revalidate: 3600,
  tags: ["banner.campuses"],
});

const cachedClassTypes = unstable_cache(
  async (term: string) =>
    db
      .selectDistinct({ classType: sectionsT.classType })
      .from(sectionsT)
      .where(eq(sectionsT.term, term))
      .then((c) => c.map((e) => e.classType)),
  [],
  { revalidate: 3600, tags: ["banner.classTypes"] },
);

const cachedNupaths = unstable_cache(async () => getNupaths(), [], {
  revalidate: 3600,
  tags: ["banner.nupaths"],
});

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();
  const term = (await props.params)?.term ?? "";

  const subjects = cachedSubjects();
  const campuses = cachedCampuses();
  const classTypes = cachedClassTypes(term);
  const nupaths = cachedNupaths();

  return (
    <MobileWrapper
      terms={terms}
      subjects={subjects}
      campuses={campuses}
      classTypes={classTypes}
      nupaths={nupaths}
      coursePage={props.children}
    />
  );
}
