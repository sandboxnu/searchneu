"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(searchParams);
      if (!query.trim()) {
        params.delete("q");
        router.replace(`${pathname}`);
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
    <div className="">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
    </div>
  );
}
