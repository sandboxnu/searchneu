"use client";

import { GroupedTerms } from "@/lib/types";
import { use, useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/cn";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomeSearchInterface({
  terms,
}: {
  terms: Promise<GroupedTerms>;
}) {
  const termsObject = use(terms);
  const router = useRouter();
  const [selectedCollege, setSelectedCollege] = useState<"neu" | "cps" | "law">(
    "neu",
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        if (document.activeElement === searchInputRef.current) return;

        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function onSubmit(query: string) {
    let term = "";
    if (selectedCollege === "neu") {
      term = termsObject.neu[0].term;
    } else if (selectedCollege === "cps") {
      term = termsObject.cps[0].term;
    } else if (selectedCollege === "law") {
      term = termsObject.law[0].term;
    }

    router.push(`/catalog/${term}?q=${query}`);
  }

  return (
    <div className="w-full sm:px-24 md:w-auto">
      <div className="mb-4 flex w-full flex-row justify-center gap-2">
        <Button
          className={cn(
            "h-11 rounded-full border font-semibold transition duration-200",
            {
              "border-r1 bg-r1/30 text-neu hover:bg-r1/50":
                selectedCollege !== "neu",
              "border-neu bg-neu text-neu1 hover:bg-neu/80":
                selectedCollege === "neu",
            },
          )}
          onClick={() => setSelectedCollege("neu")}
        >
          <span className="md:hidden">NEU</span>
          <span className="hidden md:inline">Northeastern University</span>
        </Button>
        <Button
          className={cn(
            "h-11 rounded-full border font-semibold transition duration-200",
            {
              "border-c1 bg-c1/30 text-c6 hover:bg-c1/50":
                selectedCollege !== "cps",
              "border-cps bg-cps text-neu1 hover:bg-cps/80":
                selectedCollege === "cps",
            },
          )}
          onClick={() => setSelectedCollege("cps")}
        >
          <span className="md:hidden">CPS</span>
          <span className="hidden md:inline">
            College of Professional Studies
          </span>
        </Button>
        <Button
          className={cn(
            "h-11 rounded-full border font-semibold transition duration-200",
            {
              "border-l1 bg-l1/30 text-law hover:bg-l1/50":
                selectedCollege !== "law",
              "border-law bg-law text-neu1 hover:bg-law/80":
                selectedCollege === "law",
            },
          )}
          onClick={() => setSelectedCollege("law")}
        >
          <span className="md:hidden">LAW</span>
          <span className="hidden md:inline">School of Law</span>
        </Button>
      </div>
      <div className="relative">
        <SearchIcon
          className={cn(
            "absolute top-1/2 left-6 size-7 -translate-y-1/2 -scale-x-100 transform transition duration-200 lg:size-8",
            {
              "text-neu": selectedCollege === "neu",
              "text-cps": selectedCollege === "cps",
              "text-law": selectedCollege === "law",
            },
          )}
        />
        <Input
          placeholder="Search by course, professor, or phrase..."
          ref={searchInputRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit(e.currentTarget.value);
            }
          }}
          className={cn(
            "bg-neu1 w-full rounded-full pl-10 transition duration-200 placeholder:text-sm lg:h-16 lg:w-[650px] lg:pl-16 lg:text-2xl! lg:placeholder:text-2xl xl:w-[800px]",
            {
              "border-r1": selectedCollege === "neu",
              "border-c1": selectedCollege === "cps",
              "border-l1": selectedCollege === "law",
            },
          )}
          autoFocus={true}
        />
      </div>
    </div>
  );
}
