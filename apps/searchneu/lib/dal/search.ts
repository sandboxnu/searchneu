import "server-only";
import {
  db,
  coursesT,
  sectionsT,
  courseNupathJoinT,
  nupathsT,
  subjectsT,
  campusesT,
  roomsT,
  buildingsT,
  meetingTimesT
} from "@/lib/db";
import { type SQL, sql, eq, and, countDistinct, inArray } from "drizzle-orm";
import { cache } from "react";
import type { CourseSearchFilters, CourseSearchResult, BuildingSearchFilters, BuildingSearchResult } from "@/lib/catalog/types";
import { getTerms } from "./terms";

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
 * @param filters - structured search filters. See `CourseSearchFilters` for field docs
 * @returns filtered, scored course rows with aggregated section data
 */
export const getSearchCourses = cache(
  async (filters: CourseSearchFilters): Promise<CourseSearchResult[]> => {
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
    bm25Chunks.push(sql`${coursesT.termId} @@@ ${termId}`);

    // NOTE: honors is applied as a WHERE predicate because sectionsT is joined.
    if (honors) {
      bm25Chunks.push(sql`${sectionsT.honors} = true`);
    }

    const rows = await db
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
        score: sql<number>`paradedb.score(${coursesT.id})`,
      })
      .from(coursesT)
      .innerJoin(sectionsT, eq(coursesT.id, sectionsT.courseId))
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
      .where(sql.join(bm25Chunks, sql.raw(" AND ")))
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.courseNumber,
        coursesT.maxCredits,
        coursesT.minCredits,
        subjectsT.code,
      )
      .orderBy(sql`paradedb.score(${coursesT.id}) desc`);

    // post-filter: apply the dimensions that are not covered by the BM25 index.
    // HACK: subject filtering is also post-filter until the BM25 index is updated
    // to support subject code filtering directly
    return rows.filter(
      (r) =>
        (subjects.length === 0 || subjects.includes(r.subjectCode)) &&
        (nupaths.length === 0 || nupaths.every((n) => r.nupaths.includes(n))) &&
        (campuses.length === 0 || r.campus.some((c) => campuses.includes(c))) &&
        (classTypes.length === 0 ||
          r.classType.some((t) => classTypes.includes(t))),
    );
  },
);

// Essentially getSearchCourses, but for buildings
export const getSearchBuildings = cache(
  async (filters: BuildingSearchFilters): Promise<BuildingSearchResult[]> => {
    const {
      query, //text query
      campuses, //wtv campuses normally is; should be number I think
      minTime,
      maxTime, // Should be 0800, 0900, 1000, etc. 
      days, //days should be "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"
      minCap,
      maxCap,
    } = filters;

    const DAYS_OF_WEEK = {
      "Mo" : 0,
      "Tu" : 1,
      "We" : 2,
      "Th" : 3,
      "Fr" : 4,
      "Sa" : 5,
      "Su" : 6
    } as Record<string, number>

    const dayNums = days.map(day => DAYS_OF_WEEK[day])

    // build BM25 WHERE clause for text search and courseLevel filtering
    const sqlChunks: SQL[] = [];

    if (query) {
      // boost exact building/room matches (e.g. "Richards Hall 159") 6x over name matches
      sqlChunks.push(
        sql`${buildingsT.id} @@@ paradedb.boolean(should => ARRAY[paradedb.match('name', ${query}, distance => 0)])`,
      );
    }
    const buildings = await db
      .select({
        buildingId: buildingsT.id,
        buildingName: buildingsT.name,
        campus: campusesT.name,
        score: sql<number>`paradedb.score(${roomsT.id})`,
      })
      .from(buildingsT)
      .innerJoin(campusesT, eq(campusesT.id, buildingsT.campus))
      .where(sql.join(sqlChunks, sql.raw(" AND ")))
      .orderBy(sql`paradedb.score(${roomsT.id}) desc`);
    
    const filteredBuildings = buildings.filter(
      (r) =>
        (campuses.length === 0 || campuses.includes(r.campus))
    );

    const buildingIds = buildings.map((b) => b.buildingId)

    const roomsData = await db
      .select({
        roomId: roomsT.id,
        buildingId: roomsT.buildingId,
        approxCap: sql<number>`max(${sectionsT.seatCapacity})`,
      })
      .from(roomsT)
      .innerJoin(meetingTimesT, eq(meetingTimesT.roomId, roomsT.id))
      .innerJoin(sectionsT, eq(meetingTimesT.sectionId, sectionsT.id))
      .where(inArray(roomsT.buildingId, buildingIds))
      .groupBy(roomsT.id);

    const terms = await getTerms()
    const termId = terms.neu[0].id


    const roomIds = roomsData.map(r => r.roomId);
    const meetings = await db
      .select({
        roomId: meetingTimesT.roomId,
        days: meetingTimesT.days,
        startTime: meetingTimesT.startTime,
        endTime: meetingTimesT.endTime,
      })
      .from(meetingTimesT)
      .innerJoin(termsT, eq(meetingTimesT.termId, termsT.id))
      .where(and(
        inArray(meetingTimesT.roomId, roomIds),
        eq(termsT.id, termId)
      ));

    const res = []
    for (const building of filteredBuildings) {

      const assocRooms = roomsData.filter((r) => (r.buildingId == building.buildingId))
      
      for (const room of assocRooms) {

        if (room.approxCap < minCap || room.approxCap > maxCap) {
          continue;
        }
        const assocMeetings = meetings.filter((m) => (m.roomId == room.roomId))

        const meetingsWithHours = assocMeetings.map((meeting) => ({
          ...meeting,
          startHour:
            Math.floor(meeting.startTime / 100),
          endHour:
            Math.floor(meeting.endTime / 100),
        }));

        // Group meetings by day
        const conflicts = meetingsWithHours.filter((m) => ((m.startHour < maxTime && m.endHour > minTime) || !dayNums.some(day => m.days.includes(day))))
        if (!conflicts) {
          res.push(building)
        }
      }
    }

    return res
  }
)