"use client";

import { ResultCard } from "@/components/resultCard";
import { useParams, useSearchParams } from "next/navigation";
import { memo, Suspense, use, useDeferredValue } from "react";

interface searchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: number;
  maxCredits: number;
}

export default function SearchResults() {
  const { term } = useParams();
  const params = useSearchParams();
  const deferred = useDeferredValue(params.toString());
  const stale = deferred !== params.toString();

  return (
    <div className="bg-secondary flex h-[calc(100vh-56px)] flex-col overflow-y-scroll px-2 py-2">
      {/* <p className="text-muted-foreground">{results.length} results</p> */}
      <div className={stale ? "opacity-80" : ""}>
        <Suspense fallback={<p>loading.......</p>}>
          <ResultsList params={deferred} term={term?.toString() ?? ""} />
        </Suspense>
      </div>
    </div>
  );
}

let cKey = "!";
let cPromise: Promise<unknown> = new Promise((r) => r([]));

function fetcher<T>(key: string, p: () => string) {
  if (!Object.is(cKey, key)) {
    cKey = key;
    if (typeof window !== "undefined") {
      cPromise = fetch(p()).then((r) => r.json());
    }
  }
  return cPromise as Promise<T>;
}

const ResultsList = memo(function ResultsList(props: {
  term: string;
  params: string;
}) {
  const r = use(
    fetcher<searchResult[]>(props.params, () => {
      const searchP = new URLSearchParams(props.params);
      searchP.set("term", props.term);
      return `/api/search?${searchP.toString()}`;
    }),
  );

  if (r.length < 0) {
    return <p>No results</p>;
  }

  return (
    <ul className="space-y-4 pr-2">
      {r.map((result, index) => (
        <ResultCard
          key={index}
          result={result}
          // link={`/${props.term}/${result.subject}%20${result.courseNumber}?${props.params}`}
          link={"/"}
          active={false}
          // active={
          //   decodeURIComponent(course?.toString() ?? "") ===
          //   result.subject + " " + result.courseNumber
          // }
        />
      ))}
    </ul>
  );
});
