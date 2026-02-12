import { ScheduleTerm2 } from "@/lib/graduate/types";

/** The credits for all courses in a term. */
export const totalCreditsInTerm = (term: ScheduleTerm2<unknown>): number => {
  return term.classes.reduce((totalCreditsForTerm, course) => {
    return totalCreditsForTerm + course.numCreditsMin;
  }, 0);
};