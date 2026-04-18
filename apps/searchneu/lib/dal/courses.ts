import "server-only";
import {
  db,
  coursesT,
  courseNupathJoinT,
  nupathsT,
  subjectsT,
  termsT,
} from "@/lib/db";
import { sql, and, or, eq, desc } from "drizzle-orm";
import { cache } from "react";
import type { Course } from "@/lib/catalog/types";
import type { CourseDetails } from "@/lib/graduate/types";
import type { Requisite } from "@sneu/scraper/types";

/**
 * base query shared by all course lookups. joins subjects, nupath data, and
 * terms to populate these fields and allow filtering. always groups by all
 * non-aggregate columns
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
  .innerJoin(termsT, eq(coursesT.termId, termsT.id))
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
        eq(termsT.term, term.substring(0, 6)),
        eq(termsT.partOfTerm, term.substring(6)),
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
      .orderBy(desc(termsT.term));

    return result[0];
  },
);

/**
 * Batch-fetches the latest course name for each (subjectCode, courseNumber) pair
 * in a single query. Returns a map of "SUBJECT-COURSENUMBER" → course name.
 */
export async function getCourseNamesBatch(
  keys: Set<string>,
): Promise<Record<string, string>> {
  if (keys.size === 0) return {};

  const pairs = [...keys].map((k) => {
    const [subject, classId] = k.split("-");
    return { subject, classId };
  });

  const conditions = pairs.map((p) =>
    and(eq(subjectsT.code, p.subject), eq(coursesT.courseNumber, p.classId)),
  );

  const rows = await db
    .selectDistinctOn([subjectsT.code, coursesT.courseNumber], {
      name: coursesT.name,
      subjectCode: subjectsT.code,
      courseNumber: coursesT.courseNumber,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .where(or(...conditions))
    .orderBy(subjectsT.code, coursesT.courseNumber, desc(coursesT.termId));

  const nameMap: Record<string, string> = {};
  for (const row of rows) {
    nameMap[`${row.subjectCode}-${row.courseNumber}`] = row.name;
  }
  return nameMap;
}

/**
 * Batch-fetches the NUPath short codes for each (subjectCode, courseNumber) pair
 * in a single query. Returns a map of "SUBJECT-COURSENUMBER" → NUPath short codes.
 */
export async function getCourseNupathsBatch(
  keys: Set<string>,
): Promise<Record<string, string[]>> {
  if (keys.size === 0) return {};

  const pairs = [...keys].map((k) => {
    const [subject, classId] = k.split("-");
    return { subject, classId };
  });

  const conditions = pairs.map((p) =>
    and(eq(subjectsT.code, p.subject), eq(coursesT.courseNumber, p.classId)),
  );

  const rows = await db
    .select({
      subjectCode: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      nupaths: sql<
        string[]
      >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
    .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
    .where(or(...conditions))
    .groupBy(subjectsT.code, coursesT.courseNumber);

  const nupathMap: Record<string, string[]> = {};
  for (const row of rows) {
    nupathMap[`${row.subjectCode}-${row.courseNumber}`] = row.nupaths ?? [];
  }
  return nupathMap;
}

export type { CourseDetails };

/**
 * Batch-fetches credits, coreqs, and prereqs for each (subjectCode, courseNumber)
 * pair in a single query. Returns a map of "SUBJECT-COURSENUMBER" → CourseDetails.
 */
export async function getCourseDetailsBatch(
  keys: Set<string>,
): Promise<Record<string, CourseDetails>> {
  if (keys.size === 0) return {};

  const pairs = [...keys].map((k) => {
    const [subject, classId] = k.split("-");
    return { subject, classId };
  });

  const conditions = pairs.map((p) =>
    and(eq(subjectsT.code, p.subject), eq(coursesT.courseNumber, p.classId)),
  );

  const rows = await db
    .selectDistinctOn([subjectsT.code, coursesT.courseNumber], {
      subjectCode: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      minCredits: coursesT.minCredits,
      maxCredits: coursesT.maxCredits,
      coreqs: coursesT.coreqs,
      prereqs: coursesT.prereqs,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .where(or(...conditions))
    .orderBy(subjectsT.code, coursesT.courseNumber, desc(coursesT.termId));

  const detailsMap: Record<string, CourseDetails> = {};
  for (const row of rows) {
    detailsMap[`${row.subjectCode}-${row.courseNumber}`] = {
      minCredits: Number(row.minCredits),
      maxCredits: Number(row.maxCredits),
      coreqs: row.coreqs as Requisite,
      prereqs: row.prereqs as Requisite,
    };
  }
  return detailsMap;
}
