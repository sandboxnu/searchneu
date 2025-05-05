import { type ReactNode } from "react";
import { getTerms } from "@/lib/controllers/getTerms";
import { getSubjects } from "@/lib/controllers/getSubjects";
import { MobileWrapper } from "@/components/search/MobileWrapper";
import { getCampuses } from "@/lib/controllers/getCampuses";
import { getClassTypes } from "@/lib/controllers/getClassTypes";
import type { Option } from "@/components/ui/multi-select";
import { NUPATH_OPTIONS } from "@/lib/banner/nupaths";

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();
  const subjects = getSubjects((await props.params)?.term ?? "");
  const campuses = getCampuses((await props.params)?.term ?? "");
  const classTypes = getClassTypes((await props.params)?.term ?? "");
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
