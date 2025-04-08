"use client";

import { ResultCard } from "@/components/resultCard";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchResults() {
  const params = useSearchParams();
  const { course } = useParams();
  const [result, setResult] = useState([]);

  useEffect(() => {
    async function data() {
      const d = await fetch("/api/search?q=" + (params.get("q") ?? ""), {
        next: { revalidate: 300 },
      }).then((resp) => resp.json());
      setResult(d.result);
    }

    data();
  }, [params]);
  console.log(course);

  if (result.length < 0) {
    return <p>No results</p>;
  }

  return (
    <div className="flex flex-col overflow-y-scroll h-[calc(100vh-100px)]">
      <p className="text-muted-foreground">{result.length} results</p>
      <ul className="space-y-4 pr-2">
        {result.map((result, index) => (
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
