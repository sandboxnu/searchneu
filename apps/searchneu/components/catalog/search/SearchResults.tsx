"use client";

import { ResultCard } from "./ResultCard";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import Link from "next/link";
import useSWR from "swr";
import type { SearchResult } from "@/lib/catalog/types";

// NOTE: in general prefer named exports. however, since the `SearchResults` component
// needs to be imported dynamically to avoid SSR, it has to be default exported

/**
 */
export default function SearchResults() {
  const params = useSearchParams();
  const { term, course } = useParams();
  const deferred = useDeferredValue(params.toString());
  const stale = deferred !== params.toString();

  return (
    <div
      className={cn(
        "bg-neu2 flex h-full flex-col rounded-t-lg",
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

function ResultsList(props: { params: string; term: string; course: string }) {
  "use no memo"; // issue: https://github.com/TanStack/virtual/issues/743

  const searchP = new URLSearchParams(props.params);
  searchP.set("term", props.term);

  const { data: results } = useSWR<SearchResult[]>(
    `/api/catalog/search?${searchP.toString()}`,
    (u: string) => fetch(u).then((r) => r.json()),
    { suspense: true },
  );

  if (!results) {
    throw Error("failed searching");
  }

  const parentRef = useRef(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtual = useVirtualizer({
    count: Array.isArray(results) ? results.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 103,
    scrollPaddingStart: 0,
    overscan: 0,
  });

  const items = virtual.getVirtualItems();

  if (results.length === 0) {
    return (
      <p className="text-neu6 w-full py-1 text-center text-sm">No Results</p>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-y-auto md:pr-3">
      <ul
        className="relative w-full"
        style={{ height: `${virtual.getTotalSize()}px` }}
      >
        {items.map((v) => (
          <li
            key={v.index}
            data-index={v.index}
            ref={virtual.measureElement}
            className="absolute top-0 left-0 mb-2 w-full"
            style={{
              transform: `translateY(${v.start}px)`,
              height: `${v.size}px`,
            }}
          >
            <Link
              href={`/catalog/${props.term}/${results[v.index].subjectCode}%20${results[v.index].courseNumber}?${props.params}`}
              data-active={
                decodeURIComponent(props.course) ===
                results[v.index].subjectCode +
                  " " +
                  results[v.index].courseNumber
              }
              className="bg-neu1 data-[active=true]:border-neu3 flex cursor-default flex-col rounded-lg border-1 p-4"
            >
              <ResultCard result={results[v.index]} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultsListSkeleton() {
  return (
    <ul className="h-full space-y-2 overflow-y-clip md:pr-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <li
          key={i}
          className="bg-neu3 h-[95px] w-full animate-pulse rounded-lg"
        />
      ))}
    </ul>
  );
}
