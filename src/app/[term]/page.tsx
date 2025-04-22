import { SearchResults } from "./_mu/searchResults";
import { SearchBar } from "./_mu/searchPanel";
import { getTerms } from "@/lib/controllers/getTerms";
import { getSubjects } from "@/lib/controllers/getSubjects";

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
}) {
  const terms = getTerms();
  const subjects = getSubjects((await props.params)?.term ?? "");

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-5">
        <SearchBar terms={terms} subjects={subjects} />
      </div>
      <div className="col-span-7">
        <SearchResults />
      </div>
    </div>
  );
}
