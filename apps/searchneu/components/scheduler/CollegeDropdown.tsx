"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use, useEffect } from "react";
import type { GroupedTerms } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CollegeDropdown(props: {
  terms: Promise<GroupedTerms>;
  selectedCollege: string;
  onCollegeChange: (college: string) => void;
  onTermChange: (term: string) => void;
}) {
  const terms = use(props.terms);

  const collegeOptions = [
    { value: "neu", label: "Northeastern University" },
    { value: "cps", label: "College of Professional Studies" },
    { value: "law", label: "School of Law" },
  ];

  const availableTerms =
    terms[props.selectedCollege as keyof GroupedTerms] ?? [];

  // Auto-select first term when college changes or on initial load
  useEffect(() => {
    if (availableTerms.length > 0) {
      props.onTermChange(availableTerms[0].term);
    }
  }, [props.selectedCollege, availableTerms]);

  return (
    <div className="space-y-2">
      <Select
        onValueChange={(val) => {
          if (val === "") return;
          props.onCollegeChange(val);
        }}
        value={props.selectedCollege}
      >
        <SelectTrigger
          className={cn("bg-neu h-10 w-full font-semibold", {
            "text-neu bg-r1/20 focus-visible:border-r1 [&>svg]:text-neu":
              props.selectedCollege === "neu",
            "text-cps bg-c1/20 focus-visible:border-c1 [&>svg]:text-cps":
              props.selectedCollege === "cps",
            "text-law bg-l1/20 focus-visible:border-l1 [&>svg]:text-law":
              props.selectedCollege === "law",
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
                    props.selectedCollege === "neu" && college.value === "neu",
                  "bg-c1/20":
                    props.selectedCollege === "cps" && college.value === "cps",
                  "bg-l1/20":
                    props.selectedCollege === "law" && college.value === "law",
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
