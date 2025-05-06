import { type ReactNode } from "react";
import { getTerms } from "@/lib/controllers/getTerms";
import { MobileWrapper } from "@/components/search/MobileWrapper";
import type { Option } from "@/components/ui/multi-select";
import { NUPATH_OPTIONS } from "@/lib/banner/nupaths";
import { db } from "@/db";
import { subjectsT, sectionsT } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();

  const subjects = db
    .select({
      value: subjectsT.code,
      label: subjectsT.name,
    })
    .from(subjectsT)
    .where(eq(subjectsT.term, (await props.params)?.term ?? ""));

  const campuses = db
    .selectDistinct({ campus: sectionsT.campus })
    .from(sectionsT)
    .where(eq(sectionsT.term, (await props.params)?.term ?? ""))
    .then((c) => c.map((e) => e.campus));

  const classTypes = db
    .selectDistinct({ classType: sectionsT.classType })
    .from(sectionsT)
    .where(eq(sectionsT.term, (await props.params)?.term ?? ""))
    .then((c) => c.map((e) => e.classType));

  // NOTE: the static nupaths needs a promise b/c the use hook is called on it later
  const nupaths = new Promise((r) => r(NUPATH_OPTIONS)) as Promise<Option[]>;

  return (
    <div className="grid h-full w-full grid-cols-12">
      <MobileWrapper
        terms={terms}
        subjects={subjects}
        campuses={campuses}
        classTypes={classTypes}
        nupaths={nupaths}
      />
      <div className="col-span-12 xl:col-span-7">{props.children}</div>
    </div>
  );
}
