import { db } from "@/db";
import { termsT } from "@/db/schema";
import type { GroupedTerms } from "./types";

// getTerms retreives all the terms from the db
export async function getTerms() {
  const terms = await db
    .select({ term: termsT.term, name: termsT.name })
    .from(termsT);

  const groupedTerms = terms.reduce(
    (agg, t) => {
      // the last digit of term represents the college
      const type = t.term.slice(5, 6);

      if (type === "0") {
        // 0 - neu semester
        agg.neu.push(t);
      } else if (type === "4" || type === "5") {
        // 4 - cps semester; 5 - cps quater
        agg.cps.push(t);
      } else if (type === "2" || type === "8") {
        // 2 - law semester; 8 - law quarter
        agg.law.push(t);
      }

      return agg;
    },
    { neu: [], cps: [], law: [] } as GroupedTerms,
  );

  // for each college, order the keys greatest to least (most recent to least recent)
  groupedTerms.neu.sort((a, b) => b.term.localeCompare(a.term));
  groupedTerms.cps.sort((a, b) => b.term.localeCompare(a.term));
  groupedTerms.law.sort((a, b) => b.term.localeCompare(a.term));

  return groupedTerms;
}
