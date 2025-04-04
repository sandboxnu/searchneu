"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setResults(data.result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching search results:", err);
      } finally {
        setLoading(false);
      }
    };

    // debouncer
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    // Clean up the timeout when the component unmounts or query changes
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="p-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="text-lg border-white border-b-2 focus:outline-none"
      />

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <div className="pt-2">
        {results.length > 0 ? (
          <ul>
            {results.map((result, index) => (
              <li key={index} className="flex gap-2">
                <h1 className="font-semibold">
                  {result.subject + " " + result.courseNumber}
                </h1>
                <p>{result.name}</p>
                <p className="text-neutral-500">{result.score}</p>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <p>No results found</p>
        ) : null}
      </div>
    </div>
  );
}
