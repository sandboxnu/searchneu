import { Suspense } from "react";
import { SearchBar } from "./search";
import { SearchResults } from "./searchResults";

export default async function Page(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = (await props.searchParams)?.q ?? "";
  const term = await props.params.then((p) => p.term);

  return (
    <div className="py-2 px-4">
      <SearchBar />
      <Suspense key={query} fallback={<p>loading...</p>}>
        <SearchResults query={query} term={term} />
      </Suspense>
    </div>
  );
}
