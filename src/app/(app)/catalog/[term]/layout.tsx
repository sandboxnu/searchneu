import { type ReactNode } from "react";
import { getTerms } from "@/lib/controllers/getTerms";
import { MobileWrapper } from "@/components/search/MobileWrapper";
import type { Option } from "@/components/ui/multi-select";
import { NUPATH_OPTIONS } from "@/scraper/nupaths";
import { db } from "@/db";
import { subjectsT, sectionsT } from "@/db/schema";
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
  async (term: string) =>
    db
      .selectDistinct({ campus: sectionsT.campus })
      .from(sectionsT)
      .where(eq(sectionsT.term, term))
      .then((c) => c.map((e) => e.campus)),
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

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();
  const term = (await props.params)?.term ?? "";

  const subjects = cachedSubjects(term);
  const campuses = cachedCampuses(term);
  const classTypes = cachedClassTypes(term);

  // NOTE: the static nupaths needs a promise b/c the use hook is called on it later
  const nupaths = new Promise((r) => r(NUPATH_OPTIONS)) as Promise<Option[]>;

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
