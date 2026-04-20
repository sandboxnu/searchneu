"use client";

import { ResultCard } from "./ResultCard";
import {
  ReadonlyURLSearchParams,
  useParams,
  useSearchParams,
} from "next/navigation";
import { useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useCatalogSearch } from "@/lib/catalog/use-catalog-search";

// NOTE: in general prefer named exports. however, since the `SearchResults` component
// needs to be imported dynamically to avoid SSR, it has to be default exported

/**
 */
export default function SearchResults() {
  const params = useSearchParams();
  const { term, course } = useParams();

  return (
    <div className={cn("bg-neu2 flex h-full flex-col rounded-t-lg")}>
      <ResultsList
        params={params}
        term={term?.toString() ?? ""}
        course={course?.toString() ?? ""}
      />
    </div>
  );
}

function ResultsList(props: {
  params: ReadonlyURLSearchParams;
  term: string;
  course: string;
}) {
  "use no memo"; // issue: https://github.com/TanStack/virtual/issues/743

  const searchP = new URLSearchParams(props.params);

  const filters = {
    query: searchP.get("q") ?? "",
    subjects: searchP.getAll("subj").map((s) => s.toUpperCase()),
    minCourseLevel: Number(searchP.get("nci") ?? -1),
    maxCourseLevel: Number(searchP.get("xci") ?? -1),
    nupaths: searchP.getAll("nupath").map((n) => n.toUpperCase()),
    campuses: searchP.getAll("camp"),
    classTypes: searchP.getAll("clty"),
    honors: searchP.get("honors") === "true",
  };

  const { results, isLoading } = useCatalogSearch(props.term, filters);

  const parentRef = useRef(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtual = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 103,
    scrollPaddingStart: 0,
    overscan: 0,
  });

  const items = virtual.getVirtualItems();

  if (isLoading) {
    return <ResultsListSkeleton />;
  }

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
