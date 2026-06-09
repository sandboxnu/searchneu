"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GroupedTerms, Term } from "@/lib/catalog/types";
import { groupTermsByYear } from "@/lib/catalog/terms";
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
  const years = groupTermsByYear(terms[selectedCollege]);

  const updateTerm = (v: string | null) => {
    const term = terms[selectedCollege].find((t) => String(t.id) === v);
    if (term) onTermChange(term);
  };

  return (
    <Select
      onValueChange={updateTerm}
      value={selectedTerm ? String(selectedTerm.id) : undefined}
    >
      <SelectTrigger className="w-full" {...selectTriggerProps}>
        <SelectValue placeholder="Select term" className="font-semibold">
          {selectedTerm?.name ?? "Unknown"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" alignItemWithTrigger={false}>
        {years.map(({ year, terms: yearTerms }) => (
          <SelectGroup key={year}>
            <SelectLabel className="">{year}</SelectLabel>
            {yearTerms.map((t) => (
              <SelectItem key={t.id} value={t.term + t.part} className="pl-8">
                {t.name.replace(" Semester", "")}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
