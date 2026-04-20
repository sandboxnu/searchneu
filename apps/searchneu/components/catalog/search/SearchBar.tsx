"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { track } from "@vercel/analytics";
import { useSearchParamWriter } from "@/lib/catalog/useSearchParamWriter";

export function SearchBar() {
  const searchParams = useSearchParams();
  const { setValue } = useSearchParamWriter();
  const { course } = useParams();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");
  const [popped, setPopped] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) track("search", { query });
      setValue("q", query.trim() ? query : null, "replace");
    }, 100);

    if (!course) {
      if (!query.trim()) {
        document.title = `SearchNEU`;
      } else {
        document.title = `${query} | SearchNEU`;
      }
    }

    return () => clearTimeout(timeoutId);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        if (document.activeElement === searchInputRef.current) return;

        e.preventDefault();
        searchInputRef.current?.focus();
        setPopped(true);
        setTimeout(() => setPopped(false), 200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleSubmit() {
    setQuery(inputValue.trim());
    setValue("q", query.trim() ? query : null);
  }

  return (
    <div
      className={`relative w-full transition-transform duration-200 ${
        popped ? "scale-[1.017]" : "scale-100"
      }`}
    >
      <SearchIcon
        color="red"
        className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 -scale-x-100 transform"
      />
      <Input
        ref={searchInputRef}
        className="bg-neu0 focus:border-neu3 visible h-10 border pl-10 md:hidden"
        placeholder="Search by course or phrase..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <Input
        ref={searchInputRef}
        className="bg-neu0 focus:border-neu3 hidden h-10 border pl-10 md:block"
        placeholder="Search by course or phrase..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <span className="bg-neu2 text-neu7 absolute top-2 right-2 bottom-2 hidden items-center rounded-full px-3 text-xs font-medium md:flex">
        type / to search
      </span>
    </div>
  );
}
