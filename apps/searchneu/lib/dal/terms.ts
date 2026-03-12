import "server-only";
import { db, termsT } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";
import type { GroupedTerms, TermDetail } from "@/lib/catalog/types";

/**
 * returns all known terms, grouped by college, sorted most-recent-first
 * within each group
 */
export const getTerms = cache(async (): Promise<GroupedTerms> => {
  const terms = await db
    .select({ term: termsT.term, name: termsT.name })
    .from(termsT);

  const groupedTerms = terms.reduce(
    (agg, t) => {
      // the 6th character of the term code identifies the college
      const type = t.term.slice(5, 6);

      if (type === "0") {
        agg.neu.push(t);
      } else if (type === "4" || type === "5") {
        agg.cps.push(t);
      } else if (type === "2" || type === "8") {
        agg.law.push(t);
      }

      return agg;
    },
    { neu: [], cps: [], law: [] } as GroupedTerms,
  );

  groupedTerms.neu.sort((a, b) => b.term.localeCompare(a.term));
  groupedTerms.cps.sort((a, b) => b.term.localeCompare(a.term));
  groupedTerms.law.sort((a, b) => b.term.localeCompare(a.term));

  return groupedTerms;
});

/**
 * returns the full term record for a given term code, or `undefined` if the
 * term does not exist. includes `activeUntil` and `updatedAt` (needed
 * to determine whether live seat-count data should be shown)
 *
 * @param termId - 6-character Banner term code, e.g. `"202510"`
 */
export const getTerm = cache(
  async (termId: string): Promise<TermDetail | undefined> => {
    const result = await db
      .select()
      .from(termsT)
      .where(eq(termsT.term, termId));
    return result[0];
  },
);
