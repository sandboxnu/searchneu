import "server-only";
import {
  db,
  coursesT,
  sectionsT,
  courseNupathJoinT,
  nupathsT,
  subjectsT,
  campusesT,
} from "@/lib/db";
import { type SQL, sql, eq, countDistinct } from "drizzle-orm";
import { cache } from "react";
import type { SearchFilters, SearchResult } from "@/lib/catalog/types";

// > It's data access - complex data access, but data access. - Copilot

/**
 * Searches courses for a given term using ParadeDB's BM25 full-text index,
 * then aggregates section-level data (seat counts, campus, class types) per
 * course so results can be displayed without secondary queries.
 *
 * ## Query strategy
 * The BM25 index covers `term`, `name`, `register`, and `courseNumber`. Filters
 * that map cleanly onto indexed fields (`query`, `minCourseLevel`,
 * `maxCourseLevel`, `honors`) are applied as index predicates in the WHERE
 * clause for maximum performance.
 *
 * Filters that are not in the BM25 index (`subjects`, `nupaths`, `campuses`,
 * `classTypes`) are applied as in-memory post-filters on the result set. This
 * is a known limitation — adding them to the index is tracked separately.
 *
 * ## Filter semantics
 * - All array filters are OR within the field, AND across fields.
 * - An empty array means "no filter" for that dimension.
 * - `minCourseLevel` / `maxCourseLevel` use -1 as a sentinel for "no bound".
 *   The values represent the thousands digit (e.g. `4` → 4000–4999).
 *
 * ## Ordering
 * Results are ordered by ParadeDB relevance score descending. When `query` is
 * empty, all courses score equally and ordering is effectively arbitrary.
 *
 * Deduplicated per render pass via React cache.
 *
 * @param filters - Structured search filters. See `SearchFilters` for field docs.
 * @returns Filtered, scored course rows with aggregated section data.
 */
export const searchCourses = cache(
  async (filters: SearchFilters): Promise<SearchResult[]> => {
    const {
      term,
      query,
      subjects,
      minCourseLevel,
      maxCourseLevel,
      nupaths,
      campuses,
      classTypes,
      honors,
    } = filters;

    // Build BM25 WHERE clause incrementally. The first chunk is always the
    // term filter, which acts as the primary partition of the index.
    const sqlChunks: SQL[] = [sql`${coursesT.term} @@@ ${term}`];

    if (query) {
      // Boost exact register matches (e.g. "CS 3500") 6× over name matches.
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.id} @@@ paradedb.boolean(should => ARRAY[paradedb.match('name', ${query}, distance => 0), paradedb.boost(6.0, paradedb.match('register', ${query}))])`,
      );
    }

    if (minCourseLevel !== -1) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.courseNumber} @@@ ${">= " + String(minCourseLevel * 1000)}`,
      );
    }

    if (maxCourseLevel !== -1) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.courseNumber} @@@ ${"<= " + String(maxCourseLevel * 1000 + 999)}`,
      );
    }

    // NOTE: honors is applied as an index predicate because sectionsT is joined.
    // If the join is ever removed, this would need to move to the post-filter.
    if (honors) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(sql`${sectionsT.honors} = true`);
    }

    const rows = await db
      .select({
        id: coursesT.id,
        name: coursesT.name,
        courseNumber: coursesT.courseNumber,
        subject: subjectsT.code,
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
        score: sql<number>`paradedb.score(${coursesT.id})`,
      })
      .from(coursesT)
      .innerJoin(sectionsT, eq(coursesT.id, sectionsT.courseId))
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
      .where(sql.join(sqlChunks, sql.raw(" ")))
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.courseNumber,
        coursesT.maxCredits,
        coursesT.minCredits,
        subjectsT.code,
      )
      .orderBy(sql`paradedb.score(${coursesT.id}) desc`);

    // Post-filter: apply the dimensions that are not covered by the BM25 index.
    // HACK: subject filtering is also post-filter until the BM25 index is updated
    // to support subject code filtering directly.
    return rows.filter(
      (r) =>
        (subjects.length === 0 || subjects.includes(r.subject)) &&
        (nupaths.length === 0 || nupaths.every((n) => r.nupaths.includes(n))) &&
        (campuses.length === 0 || r.campus.some((c) => campuses.includes(c))) &&
        (classTypes.length === 0 ||
          r.classType.some((t) => classTypes.includes(t))) &&
        (!honors || r.honors),
    );
  },
);
