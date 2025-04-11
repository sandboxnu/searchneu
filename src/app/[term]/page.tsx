import SearchResults from "./searchResults";
import { SearchBar } from "./searchPanel";
import { db } from "@/db";
import { termsT } from "@/db/schema";

export default async function Page() {
  const terms = await db
    .select({
      value: termsT.term,
      label: termsT.name,
    })
    .from(termsT);

  return (
    <div className="grid grid-cols-5">
      <div className="col-span-1">
        <SearchBar terms={terms} />
      </div>
      <div className="col-span-4">
        <SearchResults />
      </div>
    </div>
  );
}
