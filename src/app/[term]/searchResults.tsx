"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function SearchResults(props: { term: string; initData: any[] }) {
  const params = useSearchParams();
  const [result, setResult] = useState(props.initData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function data() {
      const d = await fetch("/api/search?q=" + (params.get("q") ?? ""), {
        next: { revalidate: 300 },
      }).then((resp) => resp.json());
      setResult(d.result);
      setLoading(false);
    }

    setLoading(true);
    data();
  }, [params]);

  if (loading) {
    return <p>loading...</p>;
  }

  return (
    <>
      {result.length > 0 ? (
        <>
          <p className="text-neutral-400 pt-2">{result.length} results</p>
          <ul className="">
            {result.map((result, index) => (
              <li
                key={index}
                className="flex flex-col p-2 border-neutral-100 border"
              >
                <Link
                  href={
                    "/202530/c/" +
                    result.subject +
                    " " +
                    result.courseNumber +
                    "?" +
                    params.toString()
                  }
                >
                  <div className="flex gap-2 text-lg">
                    <h1 className="font-semibold w-28">
                      {result.subject + " " + result.courseNumber}
                    </h1>
                    <p>{result.name}</p>
                    {/* <p>{result.score}</p> */}
                  </div>
                  {/* <p className="">{result.description}</p> */}
                  {/* <p className="text-neutral-500">{result.score}</p> */}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No results</p>
      )}
    </>
  );
}
