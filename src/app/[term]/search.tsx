"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(searchParams);
      if (!query.trim()) {
        params.delete("q");
        return;
      }

      params.set("q", query);
      router.replace(`${pathname}?${params.toString()}`);
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <input
      value={query}
      defaultValue={searchParams.get("query")?.toString()}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
      className="text-lg border-neutral-900 border-b-2 focus:outline-none w-1/2"
    />
  );
}
