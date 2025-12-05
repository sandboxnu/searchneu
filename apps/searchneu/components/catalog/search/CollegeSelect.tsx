"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from "react";
import type { GroupedTerms } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CollegeSelect(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { term } = useParams();

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  // HACK: this will blink but for now its fine
  if (typeof window !== "undefined")
    document.body.setAttribute("data-theme", activeCollege);

  const collegeOptions = [
    { value: "neu", label: "Northeastern University" },
    { value: "cps", label: "College of Professional Studies" },
    { value: "law", label: "School of Law" },
  ];

  return (
    <div className="space-y-2">
      <Select
        onValueChange={(val) => {
          if (val === "") return;
          const newestTerm = terms[val as keyof GroupedTerms][0];
          document.body.setAttribute("data-theme", val);
          router.push(`/catalog/${newestTerm.term}?${searchParams.toString()}`);
        }}
        value={activeCollege}
      >
        <SelectTrigger
          className={cn("bg-neu h-[40px] w-full font-semibold", {
            "text-neu bg-r1/20 focus-visible:border-r1 [&>svg]:text-neu":
              activeCollege === "neu",
            "text-cps bg-c1/20 focus-visible:border-c1 [&>svg]:text-cps":
              activeCollege === "cps",
            "text-law bg-l1/20 focus-visible:border-l1 [&>svg]:text-law":
              activeCollege === "law",
          })}
        >
          <SelectValue placeholder="Select school" />
        </SelectTrigger>
        <SelectContent>
          {collegeOptions.map((college) => (
            <SelectItem
              key={college.value}
              value={college.value}
              className={cn(
                "text-sm font-semibold",
                {
                  "text-neu focus:bg-r1/20 focus:text-neu":
                    college.value === "neu",
                  "text-cps focus:bg-c1/20 focus:text-cps":
                    college.value === "cps",
                  "text-law focus:bg-l1/20 focus:text-law":
                    college.value === "law",
                },
                {
                  "bg-r1/20":
                    activeCollege === "neu" && college.value === "neu",
                  "bg-c1/20":
                    activeCollege === "cps" && college.value === "cps",
                  "bg-l1/20":
                    activeCollege === "law" && college.value === "law",
                },
              )}
            >
              {college.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
