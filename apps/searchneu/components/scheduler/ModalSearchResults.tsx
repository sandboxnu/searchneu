"use client";

import { Suspense, use, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";

interface searchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: string;
  maxCredits: string;
  sectionsWithSeats: number;
  totalSections: number;
  nupaths: string[];
}

const ResultCard = ({ result }: { result: searchResult }) => {
  return (
    <div className="group text-neu6 hover:bg-neu2 bg-neu1 flex h-fit w-full cursor-pointer flex-row items-center justify-start gap-[8px] px-[16px] py-[12px] transition-colors">
      <p>
        <span className="group-hover:text-neu8 font-bold transition-all">
          {result.subject} {result.courseNumber}
        </span>{" "}
        {result.name}
      </p>
    </div>
  );
};

export default function ModalSearchResults({
  searchQuery,
  term,
  course,
}: {
  searchQuery: string;
  term?: string;
  course?: string;
}) {
  const deferred = useDeferredValue(searchQuery);
  const stale = deferred !== searchQuery;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-lg",
        stale ? "opacity-60" : "",
      )}
    >
      <Suspense fallback={<ResultsListSkeleton />}>
        <ResultsList
          params={deferred}
          term={term?.toString() ?? ""}
          course={course?.toString() ?? ""}
          searchQuery={searchQuery}
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
function ResultsList(props: {
  params: string;
  term: string;
  course: string;
  searchQuery: string;
}) {
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
    estimateSize: () => 106.5,
    scrollPaddingStart: 0,
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
            className="h-full w-full overflow-y-auto pt-2 md:pr-3"
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
          className="h-full w-full overflow-y-auto pt-2 md:pr-3"
        ></div>
      </>
    );
  }

  return (
    <div
      ref={parentRef}
      className="border-neu25 min-h-0 flex-1 overflow-y-auto rounded-lg border"
    >
      <div className={`relative`} style={{ height: virtual.getTotalSize() }}>
        {items.map((v) => (
          <li key={v.index} data-index={v.index} ref={virtual.measureElement}>
            <ResultCard result={results[v.index]} />
          </li>
        ))}
      </div>
    </div>
  );
}

function ResultsListSkeleton() {
  return (
    <ul className="h-[calc(100vh-128px)] space-y-1 overflow-y-clip p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="bg-neu3 h-20 w-full animate-pulse rounded"></li>
      ))}
    </ul>
  );
}
