"use client";

import { usePathname, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { track } from "@vercel/analytics";

export function ModalSearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const [popped, setPopped] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  function handleSubmit() {}

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
        className="bg-neu1 focus:border-neu3 border pl-10"
        placeholder="Search by course or phrase..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <span className="bg-neu2 text-neu7 absolute top-2 right-2 bottom-2 hidden items-center rounded-full px-3 text-xs font-medium md:flex">
        type / to search
      </span>
    </div>
  );
}
