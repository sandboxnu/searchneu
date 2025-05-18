"use client";

import { ResultCard } from "./ResultCard";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, use, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

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

export default function SearchResults() {
  const params = useSearchParams();
  const { term, course } = useParams();
  const deferred = useDeferredValue(params.toString());
  const stale = deferred !== params.toString();

  return (
    <div className="bg-neu2 flex h-[calc(100vh-108px)] flex-col xl:h-[calc(100vh-56px)]">
      <div className={stale ? "opacity-60" : ""}>
        <Suspense fallback={<ResultsListSkeleton />}>
          <ResultsList
            params={deferred}
            term={term?.toString() ?? ""}
            course={course?.toString() ?? ""}
          />
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

// this is explicitly memoized b/c the parent component
// rerenders too frequently with the searchParams and the
// memo shields the extra fetch requests
function ResultsList(props: { params: string; term: string; course: string }) {
  "use no memo"; // issue: https://github.com/TanStack/virtual/issues/743

  const results = use(
    fetcher<searchResult[]>(props.params + props.term, () => {
      const searchP = new URLSearchParams(props.params);
      searchP.set("term", props.term);
      return `/api/search?${searchP.toString()}`;
    }),
  );

  const parentRef = useRef(null);

  const virtual = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 5,
  });

  const items = virtual.getVirtualItems();

  if (results.length === 0) {
    return (
      <div
        ref={parentRef}
        className="h-[calc(100vh-108px)] w-full overflow-y-auto px-2 pt-2 xl:h-[calc(100vh-56px)]"
      >
        <p className="text-neu6 mb-2 w-full text-center text-sm">No Results</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-108px)] w-full overflow-y-auto px-2 pt-2 xl:h-[calc(100vh-56px)]"
    >
      <p className="text-neu6 mb-2 w-full text-center text-sm">
        {results.length} Results
      </p>
      <div className={`relative`} style={{ height: virtual.getTotalSize() }}>
        <ul
          className="absolute top-0 left-0 w-full"
          style={{ transform: `translateY(${items[0]?.start ?? 0}px)` }}
        >
          {items.map((v) => (
            <li
              className={`mb-2`}
              key={v.index}
              data-index={v.index}
              ref={virtual.measureElement}
            >
              <ResultCard
                result={results[v.index]}
                link={`/catalog/${props.term}/${results[v.index].subject}%20${results[v.index].courseNumber}?${props.params}`}
                active={
                  decodeURIComponent(props.course) ===
                  results[v.index].subject + " " + results[v.index].courseNumber
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResultsListSkeleton() {
  return (
    <ul className="space-y-2 p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="bg-neu3 h-20 w-full animate-pulse rounded"></li>
      ))}
    </ul>
  );
}
