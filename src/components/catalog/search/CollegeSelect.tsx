"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import type { GroupedTerms } from "@/lib/types";

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
          className={`bg-secondary h-[40px] w-full font-[700] ${
            activeCollege === "neu"
              ? "bg-[#FAD7DA33] text-[#E63946]"
              : activeCollege === "cps"
                ? "bg-[#FFECD233] text-[#FF9F1C]"
                : "bg-[#DAE5EB4D] text-[#457B9D]"
          }`}
        >
          <SelectValue placeholder="Select school" />
        </SelectTrigger>
        <SelectContent>
          {collegeOptions.map((college) => (
            <SelectItem
              key={college.value}
              value={college.value}
              className={`text-[14px] font-[700] ${
                college.value === "neu"
                  ? "text-[#E63946]"
                  : college.value === "cps"
                    ? "text-[#FF9F1C]"
                    : "text-[#457B9D]"
              } ${
                activeCollege === "neu" && college.value === "neu"
                  ? "bg-[#FAD7DA33]"
                  : activeCollege === "cps" && college.value === "cps"
                    ? "bg-[#FFECD233]"
                    : activeCollege === "law" && college.value === "law"
                      ? "bg-[#DAE5EB4D]"
                      : ""
              }`}
            >
              {college.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
