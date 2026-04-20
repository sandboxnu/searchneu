import "server-only";
import {
  db,
  coursesT,
  sectionsT,
  courseNupathJoinT,
  nupathsT,
  subjectsT,
  campusesT,
  termsT,
} from "@/lib/db";
import { sql, eq, and, countDistinct } from "drizzle-orm";
import { cache } from "react";
import type { CourseSearchResult } from "@/lib/catalog/types";

/**
 * fetches all courses for a given term with aggregated section data.
 * used to build the client-side MiniSearch index. no text search is
 * performed — all courses for the term are returned, ordered by name.
 *
 * @param termCode - Banner term code, e.g. `"202510"`
 * @returns all courses for the term with aggregated section metadata
 */
export const getAllCoursesForTerm = cache(
  async (termCode: string): Promise<CourseSearchResult[]> => {
    const termRow = await db
      .select({ id: termsT.id })
      .from(termsT)
      .where(
        and(
          eq(termsT.term, termCode.substring(0, 6)),
          eq(termsT.partOfTerm, termCode.substring(6)),
        ),
      )
      .limit(1);

    if (termRow.length === 0) return [];
    const termId = termRow[0].id;

    return db
      .select({
        id: coursesT.id,
        name: coursesT.name,
        courseNumber: coursesT.courseNumber,
        subjectCode: subjectsT.code,
        maxCredits: coursesT.maxCredits,
        minCredits: coursesT.minCredits,
        nupaths: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
        nupathNames: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.name}), null)`,
        prereqs: coursesT.prereqs,
        coreqs: coursesT.coreqs,
        postreqs: coursesT.postreqs,
        totalSections: countDistinct(sectionsT.id),
        sectionsWithSeats: sql<number>`count(distinct case when ${sectionsT.seatRemaining} > 0 then ${sectionsT.id} end)`,
        campus: sql<string[]>`array_agg(distinct ${campusesT.name})`,
        classType: sql<string[]>`array_agg(distinct ${sectionsT.classType})`,
        honors: sql<boolean>`bool_or(${sectionsT.honors})`,
        score: sql<number>`0`,
      })
      .from(coursesT)
      .innerJoin(sectionsT, eq(coursesT.id, sectionsT.courseId))
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
      .where(eq(coursesT.termId, termId))
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.courseNumber,
        coursesT.maxCredits,
        coursesT.minCredits,
        subjectsT.code,
      )
      .orderBy(coursesT.name);
  },
);
