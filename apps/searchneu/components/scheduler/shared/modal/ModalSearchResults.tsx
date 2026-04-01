"use client";

import { SearchResult, Term } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Suspense, use, useDeferredValue, useRef } from "react";

const ResultCard = ({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: (course: SearchResult) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(result)}
      className="group text-neu6 hover:bg-neu2 bg-neu1 h-10 w-full cursor-pointer px-4 py-3 text-[14px] transition-colors"
    >
      <p className="flex min-w-0 items-center gap-1">
        <span className="text-neu8 shrink-0 font-bold">
          {result.subjectCode} {result.courseNumber}
        </span>
        <span className="truncate">{result.name}</span>
      </p>
    </div>
  );
};

export default function ModalSearchResults({
  searchQuery,
  term,
  onSelectSearchResult,
}: {
  searchQuery: string;
  term: Term;
  onSelectSearchResult: (course: SearchResult) => void;
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
          onSelectSearchResult={onSelectSearchResult}
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
  onSelectSearchResult,
}: {
  query: string;
  term: Term;
  onSelectSearchResult: (course: SearchResult) => void;
}) {
  "use no memo";

  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set("term", term.term + term.part);
  const url = `/api/catalog/search?${searchParams.toString()}`;
  const cacheKey = `${query}-${term}`;

  const results = use(
    fetcher<SearchResult[] | { error: string }>(cacheKey, url),
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const virtual = useVirtualizer({
    count: Array.isArray(results) ? Math.min(results.length, 20) : 0,
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
              <ResultCard
                result={results[v.index]}
                onSelect={onSelectSearchResult}
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
    <div className="flex-1 space-y-2 overflow-hidden p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-neu3 flex h-10 w-full animate-pulse items-center justify-between rounded-lg px-4 py-3"
        >
          {/* simulate subject & courseNumber */}
          <div className="flex min-w-0 items-center gap-1">
            <div className="bg-neu4 h-3.5 w-10 rounded"></div>
            <div className="bg-neu4 h-3.5 flex-1 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
