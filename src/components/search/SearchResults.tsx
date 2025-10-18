"use client";

import { ResultCard } from "./ResultCard";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, use, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";

interface SearchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: number;
  maxCredits: number;
  sectionsWithSeats: number;
  totalSections: number;
  nupaths: string[];
}

/**
 * SearchResults Component
 * Displays virtualized list of course search results
 */
export default function SearchResults() {
  const params = useSearchParams();
  const { term, course } = useParams();
  const deferred = useDeferredValue(params.toString());
  const stale = deferred !== params.toString();

  return (
    <div
      className={cn(
        "bg-secondary flex h-[calc(100vh-124px)] flex-col rounded-t-lg",
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

// Single value cache for the data fetcher
// The fetch promise is stored outside the React tree to avoid recreation on rerenders
let cacheKey = "!";
let cachePromise: Promise<unknown> = new Promise((resolve) => resolve([]));

function fetcher<T>(key: string, pathFactory: () => string) {
  if (!Object.is(cacheKey, key)) {
    cacheKey = key;
    // If window is undefined, then we are in SSR and cannot do a relative fetch
    if (typeof window !== "undefined") {
      cachePromise = fetch(pathFactory()).then((response) => response.json());
    }
  }

  return cachePromise as Promise<T>;
}

interface ResultsListProps {
  params: string;
  term: string;
  course: string;
}

/**
 * ResultsList Component
 * Virtualized results list with efficient rendering
 * Explicitly not memoized due to TanStack Virtual issue #743
 */
function ResultsList(props: ResultsListProps) {
  "use no memo";

  const results = use(
    fetcher<SearchResult[] | { error: string }>(
      props.params + props.term,
      () => {
        const searchParams = new URLSearchParams(props.params);
        searchParams.set("term", props.term);
        return `/api/search?${searchParams.toString()}`;
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
          <p className="text-neutral-600 w-full py-1 text-center text-sm">
            Type more to search
          </p>
          <div
            ref={parentRef}
            className="h-[calc(100vh-124px)] w-full overflow-y-auto pt-2 pr-2"
          />
        </>
      );
    }

    throw new Error("Unexpected error in search results");
  }

  if (results.length === 0) {
    return (
      <>
        <p className="text-neutral-600 w-full py-1 text-center text-sm">
          No Results
        </p>
        <div
          ref={parentRef}
          className="h-[calc(100vh-124px)] w-full overflow-y-auto pt-2 pr-2"
        />
      </>
    );
  }

  return (
    <>
      <div
        ref={parentRef}
        className="h-[calc(100vh-124px)] w-full overflow-y-auto pr-2"
      >
        <div className="relative" style={{ height: virtual.getTotalSize() }}>
          <ul
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${items[0]?.start ?? 0 - virtual.options.scrollMargin - 16}px)`,
            }}
          >
            {items.map((virtualItem) => (
              <li
                className="mb-1"
                key={virtualItem.index}
                data-index={virtualItem.index}
                ref={virtual.measureElement}
              >
                <ResultCard
                  result={results[virtualItem.index]}
                  link={`/catalog/${props.term}/${results[virtualItem.index].subject}%20${results[virtualItem.index].courseNumber}?${props.params}`}
                  active={
                    decodeURIComponent(props.course) ===
                    `${results[virtualItem.index].subject} ${results[virtualItem.index].courseNumber}`
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

/**
 * ResultsListSkeleton Component
 * Loading skeleton for search results
 */
function ResultsListSkeleton() {
  return (
    <ul className="h-[calc(100vh-124px)] space-y-1 overflow-y-clip p-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <li key={index} className="bg-primary h-20 w-full animate-pulse rounded" />
      ))}
    </ul>
  );
}
