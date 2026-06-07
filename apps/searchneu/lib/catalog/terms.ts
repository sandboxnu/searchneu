/**
 * Shared building blocks for the college + term `<Select>` dropdowns. Both the
 * catalog filter panel and the scheduler dashboard render these widgets, so the
 * term-grouping logic, college options, and college color styling live here to
 * stay in sync.
 */

import type { GroupedTerms, Term } from "./types";
import { cn } from "@/lib/cn";

export type College = keyof GroupedTerms;

export const COLLEGE_OPTIONS = [
  { value: "neu", label: "Northeastern University" },
  { value: "cps", label: "College of Professional Studies" },
  { value: "law", label: "School of Law" },
] as const satisfies ReadonlyArray<{ value: College; label: string }>;

/** Conditional classes for the college `<SelectTrigger>`, keyed by active college. */
export function collegeTriggerClass(active: College) {
  return cn({
    "text-r5 bg-r1/20 focus-visible:border-r1 [&>svg]:text-r5 border-transparent":
      active === "neu",
    "text-cps bg-c1/20 focus-visible:border-c1 [&>svg]:text-cps border-transparent":
      active === "cps",
    "text-law bg-l1/20 focus-visible:border-l1 [&>svg]:text-law border-transparent":
      active === "law",
  });
}

/** Conditional classes for a college `<SelectItem>`, given its value and the active college. */
export function collegeItemClass(value: College, active: College) {
  return cn(
    {
      "text-r5 focus:bg-r1/20 focus:text-r5 data-selected:text-r5":
        value === "neu",
      "text-cps focus:bg-c1/20 focus:text-cps data-selected:text-cps":
        value === "cps",
      "text-law focus:bg-l1/20 focus:text-law data-selected:text-law":
        value === "law",
    },
    {
      "bg-r1/20": active === "neu" && value === "neu",
      "bg-c1/20": active === "cps" && value === "cps",
      "bg-l1/20": active === "law" && value === "law",
    },
  );
}

/** The order terms are shown within a single year. */
const TERM_ORDER: Record<string, number> = {
  Fall: 0,
  Spring: 1,
  "Full Summer": 2,
  "Summer 1": 3,
  "Summer 2": 4,
};

/**
 * Groups terms by academic year, newest year first, with each year's terms
 * ordered Fall → Spring → Summer. The year is parsed from the 4-digit token in
 * each term's name.
 */
export function groupTermsByYear(
  terms: Term[],
): { year: string; terms: Term[] }[] {
  const byYear = terms.reduce<Record<string, Term[]>>((acc, t) => {
    const year = t.name
      .split(" ")
      .filter((s) => s.length === 4 && !isNaN(Number(s)))[0];
    (acc[year] ??= []).push(t);
    return acc;
  }, {});

  const termName = (t: Term) => t.name.replace(" Semester", "").split(" ")[0];
  Object.values(byYear).forEach((yearTerms) =>
    yearTerms.sort((a, b) => TERM_ORDER[termName(a)] - TERM_ORDER[termName(b)]),
  );

  return Object.keys(byYear)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({ year, terms: byYear[year] }));
}
