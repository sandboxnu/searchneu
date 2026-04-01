"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GroupedTerms, Term } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { ComponentProps } from "react";

export function TermsDropdown({
  terms,
  selectedCollege,
  selectedTerm,
  onTermChange,
  ...selectTriggerProps
}: {
  terms: GroupedTerms;
  selectedCollege: keyof GroupedTerms;
  selectedTerm: Term | null;
  onTermChange: (term: Term) => void;
} & ComponentProps<typeof SelectTrigger>) {
  // Group terms by year and sort them
  const groupedByYear = terms[selectedCollege as keyof GroupedTerms].reduce(
    (acc, t) => {
      const year = t.name
        .split(" ")
        .filter((s) => s.length === 4 && !isNaN(Number(s)))[0];
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(t);
      return acc;
    },
    {} as Record<string, (typeof terms)[keyof GroupedTerms]>,
  );

  // Sort terms within each year
  const termOrder = {
    Fall: 0,
    Spring: 1,
    "Full Summer": 2,
    "Summer 1": 3,
    "Summer 2": 4,
  };
  Object.values(groupedByYear).forEach((yearTerms) => {
    yearTerms.sort((a, b) => {
      const aName = a.name.replace(" Semester", "").split(" ")[0];
      const bName = b.name.replace(" Semester", "").split(" ")[0];
      return (
        termOrder[aName as keyof typeof termOrder] -
        termOrder[bName as keyof typeof termOrder]
      );
    });
  });

  // Sort years in reverse chronological order
  const sortedYears = Object.keys(groupedByYear).sort(
    (a, b) => Number(b) - Number(a),
  );

  const updateTerm = (v: string) => {
    const tas = terms[selectedCollege].find((t) => String(t.id) === v);
    if (tas) onTermChange(tas);
  };

  return (
    <div className="text-neu8 space-y-2 pt-3 font-[700]">
      <Select
        onValueChange={updateTerm}
        value={selectedTerm ? String(selectedTerm.id) : undefined}
      >
        <SelectTrigger
          className="bg-secondary border-neu25 w-full cursor-pointer border border-solid"
          {...selectTriggerProps}
        >
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {sortedYears.map((year) => (
            <div key={year}>
              <SelectItem
                value={`header-${year}`}
                disabled
                className="text-neu6 text-xs font-[700] uppercase"
              >
                {year}
              </SelectItem>
              {groupedByYear[year].map((t) => (
                <SelectItem
                  key={t.id}
                  value={String(t.id)}
                  className={cn(
                    "cursor-pointer pl-4",
                    t.id === selectedTerm?.id
                      ? "text-neu8 font-[600]"
                      : "text-neu6 font-[400]",
                  )}
                >
                  {t.name.replace(" Semester", "")}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
