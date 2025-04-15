"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar(props: {
  terms: {
    value: string;
    label: string;
  }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { term } = useParams();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(searchParams);
      if (!query.trim()) {
        params.delete("q");
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }

      params.set("q", query);
      router.replace(`${pathname}?${params.toString()}`);
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="px-2 py-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      <Select
        onValueChange={(e) => router.push(`/${e}?${searchParams.toString()}`)}
        // value={props.terms[0].value}
        value={term?.toString()}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Term" />
        </SelectTrigger>
        <SelectContent>
          {props.terms.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
