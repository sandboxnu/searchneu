"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Suspense, use } from "react";
import type { GroupedTerms } from "@/lib/catalog/types";
import {
  COLLEGE_OPTIONS,
  collegeItemClass,
  collegeTriggerClass,
  type College,
} from "@/lib/catalog/terms";
import { cn } from "@/lib/cn";
import { FilterSection, FilterSkeleton } from "./FilterSection";

export function CollegeSelect(props: { terms: Promise<GroupedTerms> }) {
  return (
    <FilterSection label="SCHOOL">
      <Suspense fallback={<FilterSkeleton />}>
        <CollegeSelectControl terms={props.terms} />
      </Suspense>
    </FilterSection>
  );
}

function CollegeSelectControl(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { term } = useParams();

  const activeCollege = (Object.keys(terms).find((k) =>
    terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
  ) ?? "neu") as College;

  return (
    <Select
      onValueChange={(val) => {
        if (!val) return;
        const newestTerm = terms[val as keyof GroupedTerms][0];
        router.push(
          `/catalog/${newestTerm.term + newestTerm.part}?${searchParams.toString()}`,
        );
      }}
      value={activeCollege}
    >
      <SelectTrigger
        className={cn(
          "bg-r5 h-[40px] w-full font-semibold",
          collegeTriggerClass(activeCollege),
        )}
      >
        <SelectValue placeholder="Select school">
          {COLLEGE_OPTIONS.find((o) => o.value === activeCollege)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" alignItemWithTrigger={false}>
        {COLLEGE_OPTIONS.map((college) => (
          <SelectItem
            key={college.value}
            value={college.value}
            className={cn(
              "text-sm font-semibold",
              collegeItemClass(college.value, activeCollege),
            )}
          >
            {college.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
