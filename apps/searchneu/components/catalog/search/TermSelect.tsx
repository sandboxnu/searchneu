"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use, type ComponentProps } from "react";
import type { GroupedTerms } from "@/lib/types";
import { cn } from "@/lib/cn";

export function TermSelect(
  props: { terms: Promise<GroupedTerms> } & ComponentProps<
    typeof SelectTrigger
  >,
) {
  const terms = use(props.terms);

  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  // Group terms by year and sort them
  const groupedByYear = terms[activeCollege as keyof GroupedTerms].reduce(
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

  return (
    <div className="text-neu8 space-y-2 pt-3 font-[700]">
      <Select
        onValueChange={(e) =>
          router.push(`/catalog/${e}?${searchParams.toString()}`)
        }
        value={term?.toString()}
      >
        <SelectTrigger
          className="bg-secondary border-neu25 w-full border border-solid"
          {...props}
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
                  key={t.term}
                  value={t.term}
                  className={cn(
                    "pl-4",
                    t.term === term?.toString()
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
