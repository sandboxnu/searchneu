"use client";

import { Suspense, use, useDeferredValue, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";

export interface searchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: string;
  maxCredits: string;
  sectionsWithSeats: number;
  totalSections: number;
  nupaths: string[];
}

const ResultCard = ({
  result,
  onSelect,
}: {
  result: searchResult;
  onSelect: (course: searchResult) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(result)}
      className="group text-neu6 hover:bg-neu2 bg-neu1 flex h-fit w-full cursor-pointer flex-row items-center justify-start gap-[8px] px-[16px] py-[12px] transition-colors"
    >
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
  onSelectCourse,
}: {
  searchQuery: string;
  term: string;
  onSelectCourse: (course: searchResult) => void;
}) {
  const deferredQuery = useDeferredValue(searchQuery);
  const deferredTerm = useDeferredValue(term);
  const stale = deferredQuery !== searchQuery || deferredTerm !== term;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg",
        stale ? "opacity-60" : "",
      )}
    >
      <Suspense fallback={<ResultsListSkeleton />}>
        <ResultsList
          query={deferredQuery}
          term={deferredTerm}
          onSelectCourse={onSelectCourse}
        />
      </Suspense>
    </div>
  );
}

// Cache for the data fetcher
let cacheKey = "";
let cachePromise: Promise<unknown> = Promise.resolve([]);

function fetcher<T>(key: string, url: string): Promise<T> {
  if (cacheKey !== key) {
    cacheKey = key;
    if (typeof window !== "undefined") {
      cachePromise = fetch(url).then((r) => r.json());
    }
  }
  return cachePromise as Promise<T>;
}

function ResultsList({
  query,
  term,
  onSelectCourse,
}: {
  query: string;
  term: string;
  onSelectCourse: (course: searchResult) => void;
}) {
  "use no memo";

  // Build the API URL with proper params
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set("term", term);
  const url = `/api/search?${searchParams.toString()}`;
  const cacheKey = `${query}-${term}`;

  const results = use(
    fetcher<searchResult[] | { error: string }>(cacheKey, url),
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const virtual = useVirtualizer({
    count: Array.isArray(results) ? results.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const items = virtual.getVirtualItems();

  if (!Array.isArray(results)) {
    if (results.error === "insufficient query length") {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neu6 text-sm">Type more to search</p>
        </div>
      );
    }
    throw new Error(results.error || "Unknown error");
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-neu6 text-sm">No Results</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="border-neu25 min-h-0 flex-1 overflow-y-auto rounded-lg border"
    >
      <div className="relative" style={{ height: virtual.getTotalSize() }}>
        <ul
          className="absolute top-0 left-0 w-full"
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((v) => (
            <li key={v.index} data-index={v.index} ref={virtual.measureElement}>
              <ResultCard result={results[v.index]} onSelect={onSelectCourse} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResultsListSkeleton() {
  return (
    <div className="flex-1 space-y-1 overflow-hidden p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-neu3 h-12 w-full animate-pulse rounded"
        ></div>
      ))}
    </div>
  );
}
