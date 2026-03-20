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
import { type SQL, sql, eq, countDistinct, and } from "drizzle-orm";
import { cache } from "react";
import type { SearchFilters, SearchResult } from "@/lib/catalog/types";

// > It's data access - complex data access, but data access. - Copilot

/**
 * searches courses for a given term using ParadeDB's BM25 full-text index,
 * then aggregates section-level data (seat counts, campus, class types) per
 * course so results can be displayed without secondary queries
 *
 * ## query strategy
 * the BM25 index covers `name`, `register`, and `courseNumber`. Term filtering
 * is done via a regular WHERE clause on `coursesT.termId`. filters that map
 * cleanly onto indexed fields (`query`, `minCourseLevel`, `maxCourseLevel`)
 * are applied as index predicates in the WHERE clause for maximum performance
 *
 * filters that are not in the BM25 index (`subjects`, `nupaths`, `campuses`,
 * `classTypes`) are applied as in-memory post-filters on the result set. This
 * is a known limitation and adding them to the index is tracked separately
 *
 * ## filter semantics
 * - all array filters are OR within the field, AND across fields
 * - an empty array means "no filter" for that dimension.
 * - `minCourseLevel` / `maxCourseLevel` use -1 as a sentinel for "no bound"
 *   The values represent the thousands digit (e.g. `4` → 4000–4999)
 *
 * ## ordering
 * results are ordered by ParadeDB relevance score descending when a text query
 * is present. When `query` is empty, ordering is by course name
 *
 * @param filters - structured search filters. See `SearchFilters` for field docs
 * @returns filtered, scored course rows with aggregated section data
 */
export const getSearchCourses = cache(
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

    // Resolve term code to termId
    const termRow = await db
      .select({ id: termsT.id })
      .from(termsT)
      .where(
        and(
          eq(termsT.term, term.substring(0, 6)),
          eq(termsT.partOfTerm, term.substring(6)),
        ),
      )
      .limit(1);

    if (termRow.length === 0) return [];
    const termId = termRow[0].id;

    // build BM25 WHERE clause for text search and courseLevel filtering
    const bm25Chunks: SQL[] = [];

    if (query) {
      // boost exact register matches (e.g. "CS 3500") 6x over name matches
      bm25Chunks.push(
        sql`${coursesT.id} @@@ paradedb.boolean(should => ARRAY[paradedb.match('name', ${query}, distance => 0), paradedb.boost(6.0, paradedb.match('register', ${query}))])`,
      );
    }

    if (minCourseLevel !== -1) {
      bm25Chunks.push(
        sql`${coursesT.courseNumber} @@@ ${">= " + String(minCourseLevel * 1000)}`,
      );
    }

    if (maxCourseLevel !== -1) {
      bm25Chunks.push(
        sql`${coursesT.courseNumber} @@@ ${"<= " + String(maxCourseLevel * 1000 + 999)}`,
      );
    }

    // Combine term filter with BM25 and other predicates
    const hasBm25 = bm25Chunks.length > 0;
    const conditions: SQL[] = [sql`${coursesT.termId} = ${termId}`];

    if (hasBm25) {
      conditions.push(sql.join(bm25Chunks, sql.raw(" and ")));
    }

    // NOTE: honors is applied as a WHERE predicate because sectionsT is joined.
    if (honors) {
      conditions.push(sql`${sectionsT.honors} = true`);
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
        score: hasBm25
          ? sql<number>`paradedb.score(${coursesT.id})`
          : sql<number>`0`,
      })
      .from(coursesT)
      .innerJoin(sectionsT, eq(coursesT.id, sectionsT.courseId))
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
      .where(sql.join(conditions, sql.raw(" AND ")))
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.courseNumber,
        coursesT.maxCredits,
        coursesT.minCredits,
        subjectsT.code,
      )
      .orderBy(
        hasBm25
          ? sql`paradedb.score(${coursesT.id}) desc`
          : sql`${coursesT.name} asc`,
      );

    // post-filter: apply the dimensions that are not covered by the BM25 index.
    // HACK: subject filtering is also post-filter until the BM25 index is updated
    // to support subject code filtering directly
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
