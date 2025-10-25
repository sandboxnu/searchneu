import { type ReactNode } from "react";
import { getTerms } from "@/lib/controllers/getTerms";
import { MobileWrapper } from "@/components/search/MobileWrapper";
import { db } from "@/db";
import { subjectsT, sectionsT, nupathsT, campusesT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const cachedSubjects = unstable_cache(
  async (term: string) =>
    db.query.subjectsT
      .findMany({
        where: eq(subjectsT.term, term),
      })
      .then((subjs) => subjs.map((s) => ({ label: s.name, value: s.code }))),
  [],
  { revalidate: 3600, tags: ["banner.subjects"] },
);

const cachedCampuses = unstable_cache(
  async () =>
    db
      .select({ name: campusesT.name, group: campusesT.group })
      .from(campusesT),
  [],
  { revalidate: 3600, tags: ["banner.campuses"] },
);

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

const cachedNupaths = unstable_cache(
  async () =>
    db
      .selectDistinct({ short: nupathsT.short, name: nupathsT.name })
      .from(nupathsT)
      .then((c) => c.map((e) => ({ label: e.name, value: e.short }))),
  [],
  { revalidate: 3600, tags: ["banner.nupaths"] },
);

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();
  const term = (await props.params)?.term ?? "";

  const subjects = cachedSubjects(term);
  const campuses = cachedCampuses();
  const classTypes = cachedClassTypes(term);
  const nupaths = cachedNupaths();

  return (
    <div className="bg-secondary h-full w-full">
      <MobileWrapper
        terms={terms}
        subjects={subjects}
        campuses={campuses}
        classTypes={classTypes}
        nupaths={nupaths}
        coursePage={props.children}
      />
    </div>
  );
}
