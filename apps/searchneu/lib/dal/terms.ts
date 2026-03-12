import "server-only";
import { db, termsT } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import type { GroupedTerms, TermDetail } from "@/lib/catalog/types";

/**
 * returns all known terms, grouped by college, sorted most-recent-first
 * within each group. only returns the "main" entry per term code
 * (partOfTerm = "1"), so split terms appear as a single item
 */
export const getTerms = cache(async (): Promise<GroupedTerms> => {
  const terms = await db
    .select({
      id: termsT.id,
      term: termsT.term,
      part: termsT.partOfTerm,
      name: termsT.name,
    })
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
  async (term: string): Promise<TermDetail | undefined> => {
    const result = await db
      .select({
        id: termsT.id,
        term: termsT.term,
        part: termsT.partOfTerm,
        name: termsT.name,
        activeUntil: termsT.activeUntil,
        createdAt: termsT.createdAt,
        updatedAt: termsT.updatedAt,
      })
      .from(termsT)
      .where(
        and(
          eq(termsT.term, term.substring(0, 6)),
          eq(termsT.partOfTerm, term.substring(6)),
        ),
      );
    return result[0];
  },
);
