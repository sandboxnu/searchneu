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

export const getSearch = cache(
  async (
    term: string,
    query: string,
    subjects: string[],
    minCourseId: number,
    maxCourseId: number,
    nupaths: string[],
    campuses: string[],
    classTypes: string[],
    honors: boolean,
  ) => {
    const sqlChunks: SQL[] = [sql`${coursesT.term} @@@ ${term}`];

    if (query) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.id} @@@ paradedb.boolean(should => ARRAY[paradedb.match('name', ${query}, distance => 0), paradedb.boost(6.0, paradedb.match('register', ${query}))])`,
      );
    }

    // if (subjects && subjects.length > 0 && subjects[0] !== "") {
    //   sqlChunks.push(sql`and`);
    //   sqlChunks.push(
    //     sql`${coursesT.subject} @@@ ${"IN [" + subjects.reduce((agg, s) => agg + " " + `'${s}'`, "") + "]"}`,
    //   );
    // }

    if (minCourseId !== -1) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.courseNumber} @@@ ${">= " + String(minCourseId * 1000)}`,
      );
    }

    if (maxCourseId !== -1) {
      sqlChunks.push(sql`and`);
      sqlChunks.push(
        sql`${coursesT.courseNumber} @@@ ${"<= " + String(maxCourseId * 1000 + 999)}`,
      );
    }

    const result = await db
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
        coursesT.subject,
        coursesT.maxCredits,
        coursesT.minCredits,
        subjectsT.code,
      )
      .orderBy(sql`paradedb.score(${coursesT.id}) desc`);

    // filter through the results to find the other filters (not in db index!)
    const processed = result.filter(
      (r) =>
        (nupaths.length === 0 ||
          (nupaths.length > 0 && nupaths[0] === "") ||
          nupaths.every((x) => r.nupaths.includes(x))) &&
        (campuses.length === 0 ||
          (campuses.length > 0 && campuses[0] === "") ||
          r.campus.some((x) => campuses.includes(x))) &&
        (classTypes.length === 0 ||
          (classTypes.length > 0 && classTypes[0] === "") ||
          r.classType.some((x) => classTypes.includes(x))) &&
        // HACK: add subject filtering back in
        (subjects.length === 0 ||
          (subjects.length > 0 && subjects[0] === "") ||
          subjects.some((x) => r.subject === x)) &&
        (!honors || r.honors),
    );

    return processed;
  },
);
