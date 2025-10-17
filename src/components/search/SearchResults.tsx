"use client";

import { ResultCard } from "./ResultCard";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, use, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";

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
    <div
      className={cn(
        "bg-neu2 flex h-[calc(100vh-124px)] flex-col rounded-t-lg",
        stale ? "opacity-60" : "",
      )}
    >
      <Suspense fallback={<ResultsListSkeleton />}>
        <ResultsList
          params={deferred}
          term={term?.toString() ?? ""}
          course={course?.toString() ?? ""}
        />
      </Suspense>
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
    fetcher<searchResult[] | { error: string }>(
      props.params + props.term,
      () => {
        const searchP = new URLSearchParams(props.params);
        searchP.set("term", props.term);
        return `/api/search?${searchP.toString()}`;
      },
    ),
  );

  const parentRef = useRef(null);

  const virtual = useVirtualizer({
    count: Array.isArray(results) ? results.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    scrollPaddingStart: 28,
    overscan: 5,
  });

  const items = virtual.getVirtualItems();

  if (!Array.isArray(results)) {
    if (results.error === "insufficient query length") {
      return (
        <>
          <p className="text-neu6 w-full py-1 text-center text-sm">
            Type more to search
          </p>
          <div
            ref={parentRef}
            className="h-[calc(100vh-124px)] w-full overflow-y-auto pt-2 pr-2"
          ></div>
        </>
      );
    }

    throw new Error("");
  }

  if (results.length === 0) {
    return (
      <>
        <p className="text-neu6 w-full py-1 text-center text-sm">No Results</p>
        <div
          ref={parentRef}
          className="h-[calc(100vh-124px)] w-full overflow-y-auto pt-2 pr-2"
        ></div>
      </>
    );
  }

  return (
    <>
      {/* <p className="text-neu6 w-full py-1 text-center text-sm"> */}
      {/*   {results.length} Result{results.length > 1 && "s"} */}
      {/* </p> */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-124px)] w-full overflow-y-auto pr-2"
      >
        <div className={`relative`} style={{ height: virtual.getTotalSize() }}>
          <ul
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${items[0]?.start ?? 0 - virtual.options.scrollMargin - 16}px)`,
            }}
          >
            {items.map((v) => (
              <li
                className={`mb-1`}
                key={v.index}
                data-index={v.index}
                ref={virtual.measureElement}
              >
                <ResultCard
                  result={results[v.index]}
                  link={`/catalog/${props.term}/${results[v.index].subject}%20${results[v.index].courseNumber}?${props.params}`}
                  active={
                    decodeURIComponent(props.course) ===
                    results[v.index].subject +
                      " " +
                      results[v.index].courseNumber
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function ResultsListSkeleton() {
  return (
    <ul className="h-[calc(100vh-124px)] space-y-1 overflow-y-clip p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="bg-neu3 h-20 w-full animate-pulse rounded"></li>
      ))}
    </ul>
  );
}
