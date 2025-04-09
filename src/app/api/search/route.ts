import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { type SQL, sql, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const query = params.get("q");
  const term = params.get("term") ?? "202530";
  const subjects = params.getAll("subject");
  // const minCourseId = params.get("minCourseId");
  // const maxCourseId = params.get("maxCourseId");
  const honorsFilter = params.get("honors");
  const campusFilter = params.get("campus");

  const sqlChunks: SQL[] = [sql`${coursesT.term} @@@ ${term}`];

  if (query) {
    sqlChunks.push(sql`and`);
    sqlChunks.push(
      sql`${coursesT.id} @@@ paradedb.match('name', ${query}, distance => 0)`,
    );
  }

  if (subjects && subjects.length > 0) {
    const subjectConditions = subjects.map(
      (subject) => sql`${coursesT.subject} = ${subject}`,
    );

    sqlChunks.push(sql`and`);
    sqlChunks.push(sql`(${sql.join(subjectConditions, sql` or `)})`);
  }

  // // Apply course ID range filters if provided
  // if (minCourseId) {
  //   queryBuilder = queryBuilder.where(sql`${coursesT.id} >= ${minCourseId}`);
  // }
  //
  // if (maxCourseId) {
  //   queryBuilder = queryBuilder.where(sql`${coursesT.id} <= ${maxCourseId}`);
  // }

  if (honorsFilter && honorsFilter.toLowerCase() === "true") {
    sqlChunks.push(sql`and`);
    sqlChunks.push(sql`${sectionsT.honors} = true`);
  }

  if (campusFilter) {
    sqlChunks.push(sql`and`);
    sqlChunks.push(sql`${sectionsT.campus} = ${campusFilter}`);
  }

  const result = await db
    .select({
      id: coursesT.id,
      name: coursesT.name,
      courseNumber: coursesT.courseNumber,
      subject: coursesT.subject,
      maxCredits: coursesT.maxCredits,
      minCredits: coursesT.minCredits,
      score: sql`paradedb.score(${coursesT.id})`,
    })
    .from(coursesT)
    .innerJoin(sectionsT, eq(coursesT.id, sectionsT.courseId))
    .where(sql.join(sqlChunks, sql.raw(" ")))
    .groupBy(
      coursesT.id,
      coursesT.name,
      coursesT.courseNumber,
      coursesT.subject,
      coursesT.maxCredits,
      coursesT.minCredits,
    )
    .orderBy(sql`paradedb.score(${coursesT.id}) desc`);

  return Response.json({ result });
}
