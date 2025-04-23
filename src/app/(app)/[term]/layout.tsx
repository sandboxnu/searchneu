import { type ReactNode } from "react";
import { getTerms } from "@/lib/controllers/getTerms";
import { getSubjects } from "@/lib/controllers/getSubjects";
import { MobileWrapper } from "@/components/search/MobileWrapper";

export default async function Layout(props: {
  params: Promise<{ term: string; course?: string }>;
  children: ReactNode;
}) {
  const terms = getTerms();
  const subjects = getSubjects((await props.params)?.term ?? "");

  return (
    <div className="grid h-full w-full grid-cols-12">
      <MobileWrapper terms={terms} subjects={subjects} />
      <div className="col-span-12 xl:col-span-7">{props.children}</div>
    </div>
  );
}
