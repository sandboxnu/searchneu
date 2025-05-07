"use client";

import { ResultCard } from "./ResultCard";
import { useParams, useSearchParams } from "next/navigation";
import { memo, Suspense, use, useDeferredValue } from "react";

interface searchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: number;
  maxCredits: number;
  sectionsWithSeats: number;
  totalSections: number;
  nupaths: string[];
}

// NOTE: have to pass the searchUrl up from a server component b/c of the feature flag
export function SearchResults(props: { searchUrl: string }) {
  const params = useSearchParams();
  const deferred = useDeferredValue(params.toString());
  const stale = deferred !== params.toString();

  return (
    <div className="bg-neu2 flex h-[calc(100vh-108px)] flex-col overflow-y-scroll px-2 py-2 xl:h-[calc(100vh-56px)]">
      <div className={stale ? "opacity-80" : ""}>
        <Suspense fallback={<ResultsListSkeleton />}>
          <ResultsList params={deferred} searchUrl={props.searchUrl} />
        </Suspense>
      </div>
    </div>
  );
}

// this acts as a single value cache for the data fetcher - the fetch promise has to be stored outside
// the react tree since otherwise they would be recreated on every rerender
let cacheKey = "!";
let cachePromise: Promise<unknown> = new Promise((r) => r([]));

function fetcher<T>(key: string, p: () => string) {
  if (!Object.is(cacheKey, key)) {
    cacheKey = key;
    // if window is undefined, then we are ssr and thus cannot do a relative fetch
    if (typeof window !== "undefined") {
      // PERF: next caching on the fetch
      cachePromise = fetch(p()).then((r) => r.json());
    }
  }

  return cachePromise as Promise<T>;
}

// this is explicitly memoized a) because it is a little heavy to render and b)
// (more importantly) the parent component rerenders too frequently with
// the searchParams and the memo shields the extra fetching requests
const ResultsList = memo(function ResultsList(props: {
  params: string;
  searchUrl: string;
}) {
  const { term, course } = useParams();

  const results = use(
    fetcher<searchResult[]>(props.params + term?.toString(), () => {
      const searchP = new URLSearchParams(props.params);
      searchP.set("term", term?.toString() ?? "");
      return `${props.searchUrl}?${searchP.toString()}`;
    }),
  );

  if (results.length < 0) {
    return <p>No results</p>;
  }

  // BUG: remove the slice with a virtualized list
  return (
    <ul className="space-y-4">
      {results.slice(0, 50).map((result, index) => (
        <ResultCard
          key={index}
          result={result}
          link={`/catalog/${term?.toString()}/${result.subject}%20${result.courseNumber}?${props.params}`}
          active={
            decodeURIComponent(course?.toString() ?? "") ===
            result.subject + " " + result.courseNumber
          }
        />
      ))}
    </ul>
  );
});

function ResultsListSkeleton() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="bg-neu3 h-20 w-full animate-pulse rounded"></li>
      ))}
    </ul>
  );
}
