"use client";

import { ResultCard } from "@/components/resultCard";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface searchResult {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: number;
  maxCredits: number;
}

export default function SearchResults() {
  const params = useSearchParams();
  const { course } = useParams();
  const [results, setResults] = useState<searchResult[]>([]);

  useEffect(() => {
    async function data() {
      const d = await fetch("/api/search?q=" + (params.get("q") ?? ""), {
        next: { revalidate: 300 },
      }).then((resp) => resp.json());
      setResults(d.result);
    }

    data();
  }, [params]);
  console.log(course);

  if (results.length < 0) {
    return <p>No results</p>;
  }

  return (
    <div className="flex flex-col overflow-y-scroll h-[calc(100vh-100px)] px-2 py-2">
      <p className="text-muted-foreground">{results.length} results</p>
      <ul className="space-y-4 pr-2">
        {results.map((result, index) => (
          <ResultCard
            key={index}
            result={result}
            params={params.toString()}
            active={
              decodeURIComponent(course?.toString() ?? "") ===
              result.subject + " " + result.courseNumber
            }
          />
        ))}
      </ul>
    </div>
  );
}
