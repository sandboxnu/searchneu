"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import type { GroupedTerms, Term } from "@/lib/catalog/types";
import {
  COLLEGE_OPTIONS,
  collegeItemClass,
  collegeTriggerClass,
} from "@/lib/catalog/terms";
import { cn } from "@/lib/cn";

export function CollegeDropdown({
  terms,
  selectedCollege,
  onCollegeChange,
  onTermChange,
}: {
  terms: GroupedTerms;
  selectedCollege: keyof GroupedTerms;
  onCollegeChange: (college: keyof GroupedTerms) => void;
  onTermChange: (term: Term) => void;
}) {
  // Auto-select first term when college changes or on initial load
  useEffect(() => {
    const availableTerms = terms[selectedCollege] ?? [];
    if (availableTerms.length > 0) {
      onTermChange(availableTerms[0]);
    }
  }, [terms, selectedCollege, onTermChange]);

  return (
    <Select
      onValueChange={(val) => {
        if (!val) return;
        onCollegeChange(val as keyof GroupedTerms);
      }}
      value={selectedCollege}
    >
      <SelectTrigger
        className={cn(
          "bg-r5 h-[40px] w-full font-semibold",
          collegeTriggerClass(selectedCollege),
        )}
      >
        <SelectValue placeholder="Select school">
          {COLLEGE_OPTIONS.find((o) => o.value === selectedCollege)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" alignItemWithTrigger={false}>
        {COLLEGE_OPTIONS.map((college) => (
          <SelectItem
            key={college.value}
            value={college.value}
            className={cn(
              "text-sm font-semibold",
              collegeItemClass(college.value, selectedCollege),
            )}
          >
            {college.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
