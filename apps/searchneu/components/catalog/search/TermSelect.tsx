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
import { groupTermsByYear, type College } from "@/lib/catalog/terms";
import { cn } from "@/lib/cn";
import { FilterSection, FilterSkeleton } from "./FilterSection";

export function TermSelect(props: { terms: Promise<GroupedTerms> }) {
  return (
    <FilterSection label="SEMESTER" htmlFor="course-term-select">
      <Suspense fallback={<FilterSkeleton />}>
        <TermSelectControl terms={props.terms} id="course-term-select" />
      </Suspense>
    </FilterSection>
  );
}

function TermSelectControl(props: { terms: Promise<GroupedTerms>; id?: string }) {
  const terms = use(props.terms);

  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCollege = (Object.keys(terms).find((k) =>
    terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
  ) ?? "neu") as College;

  const years = groupTermsByYear(terms[activeCollege]);

  const termObj = terms[activeCollege].find(
    (t) => t.term + t.part === term?.toString(),
  );

  return (
    <Select
      onValueChange={(e) =>
        router.push(`/catalog/${e}?${searchParams.toString()}`)
      }
      value={term?.toString()}
    >
      <SelectTrigger id={props.id} className="w-full">
        <SelectValue placeholder="Select term" className="font-semibold">
          {termObj?.name ?? "Unknown"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" alignItemWithTrigger={false}>
        {years.map(({ year, terms: yearTerms }) => (
          <div key={year}>
            <SelectItem
              value={`header-${year}`}
              disabled
              className="text-neu6 -ml-4 text-xs font-semibold uppercase"
            >
              {year}
            </SelectItem>
            {yearTerms.map((t) => (
              <SelectItem
                key={t.id}
                value={t.term + t.part}
                className={cn(
                  t.term === term?.toString()
                    ? "text-neu8 font-semibold"
                    : "text-neu6 font-normal",
                )}
              >
                {t.name.replace(" Semester", "")}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
