"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Suspense, use } from "react";
import type { GroupedTerms } from "@/lib/catalog/types";
import { groupTermsByYear, type College } from "@/lib/catalog/terms";
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

function TermSelectControl(props: {
  terms: Promise<GroupedTerms>;
  id?: string;
}) {
  const terms = use(props.terms);

  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCollege = (Object.keys(terms).find((k) =>
    terms[k as keyof GroupedTerms].find(
      (t) => t.term + t.part === term?.toString(),
    ),
  ) ?? "neu") as College;

  const years = groupTermsByYear(terms[activeCollege]);

  const termObj = terms[activeCollege].find(
    (t) => t.term + t.part === term?.toString(),
  );

  return (
    <Select
      onValueChange={(e) => {
        if (!e) return;
        router.push(`/catalog/${e}?${searchParams.toString()}`);
      }}
      value={term?.toString()}
    >
    >
      <SelectTrigger id={props.id} className="w-full">
        <SelectValue placeholder="Select term" className="font-semibold">
          {termObj?.name ?? "Unknown"}
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
