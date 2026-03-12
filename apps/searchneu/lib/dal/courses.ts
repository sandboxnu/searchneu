import "server-only";
import { db, coursesT, courseNupathJoinT, nupathsT, subjectsT } from "@/lib/db";
import { sql, and, eq, desc } from "drizzle-orm";
import { cache } from "react";
import type { Course } from "@/lib/catalog/types";

/**
 * base query shared by all course lookups. joins subjects and nupath data to
 * populate these fields and allow filtering. always groups by all non-aggregate
 * columns
 *
 * callers should append a `.where(...)` clause to narrow the result set
 */
const courseSelectQuery = db
  .select({
    id: coursesT.id,
    name: coursesT.name,
    subject: coursesT.subject,
    subjectCode: subjectsT.code,
    courseNumber: coursesT.courseNumber,
    register: coursesT.register,
    description: coursesT.description,
    minCredits: coursesT.minCredits,
    maxCredits: coursesT.maxCredits,
    prereqs: coursesT.prereqs,
    coreqs: coursesT.coreqs,
    postreqs: coursesT.postreqs,
    updatedAt: coursesT.updatedAt,
    nupaths: sql<
      string[]
    >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
    nupathNames: sql<
      string[]
    >`array_remove(array_agg(distinct ${nupathsT.name}), null)`,
  })
  .from(coursesT)
  .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
  .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
  .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
  .groupBy(
    coursesT.id,
    coursesT.name,
    coursesT.subject,
    subjectsT.code,
    coursesT.courseNumber,
    coursesT.register,
    coursesT.description,
    coursesT.minCredits,
    coursesT.maxCredits,
    coursesT.prereqs,
    coursesT.coreqs,
    coursesT.postreqs,
    coursesT.updatedAt,
  );

/**
 * returns a single course for the given term + register, or undefined if
 * no matching course exists
 *
 * @param term         - 6-character Banner term code, e.g. `"202510"`
 * @param subjectCode  - subject code string, e.g. `"CS"`
 * @param courseNumber - course number string, e.g. `"3500"`
 */
export const getCourseByRegister = cache(
  async (
    term: string,
    subjectCode: string,
    courseNumber: string,
  ): Promise<Course | undefined> => {
    const result = await courseSelectQuery.where(
      and(
        eq(coursesT.term, term),
        eq(subjectsT.code, subjectCode),
        eq(coursesT.courseNumber, courseNumber),
      ),
    );
    return result[0];
  },
);

/**
 * returns a single course by its id, or `undefined` if not found
 *
 * @param id - numeric primary key of the course
 */
export const getCourseById = cache(
  async (id: number): Promise<Course | undefined> => {
    const result = await courseSelectQuery.where(eq(coursesT.id, id));
    return result[0];
  },
);

/**
 * returns the most recently-offered instance of a course (by register), regardless
 * of term, or `undefined` in none exists
 *
 * @param subjectCode  - subject code string, e.g. `"CS"`
 * @param courseNumber - course number string, e.g. `"3500"`
 */
export const getLatestCourseByRegister = cache(
  async (
    subjectCode: string,
    courseNumber: string,
  ): Promise<Course | undefined> => {
    const result = await courseSelectQuery
      .where(
        and(
          eq(subjectsT.code, subjectCode),
          eq(coursesT.courseNumber, courseNumber),
        ),
      )
      .orderBy(desc(coursesT.term));

    return result[0];
  },
);
