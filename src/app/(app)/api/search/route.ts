import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { convertCodeToLiteral } from "@/lib/banner/nupaths";
import { type SQL, sql, eq, countDistinct } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // parse all the potential params
  const query = params.get("q");
  const term = params.get("term");
  const subjects = params.getAll("subj");
  const nupaths = params.getAll("nupath");
  const campusFilter = params.getAll("camp");
  const classTypeFilter = params.getAll("clty");
  const minCourseId = params.get("nci");
  const maxCourseId = params.get("xci");
  const honorsFilter = params.get("honors");

  if (query?.length && query.length > 0 && query.length < 4) {
    return Response.json({ error: "insufficient query length" });
  }

  // construct the where clause based on what params are present
  const sqlChunks: SQL[] = [sql`${coursesT.term} @@@ ${term}`];

  if (query) {
    sqlChunks.push(sql`and`);
    sqlChunks.push(
      sql`${coursesT.id} @@@ paradedb.match('name', ${query}, distance => 0) OR ${coursesT.courseNumber} @@@ ${query.trim() + "^2"}`,
    );
  }

  if (subjects && subjects.length > 0) {
    sqlChunks.push(sql`and`);
    sqlChunks.push(
      sql`${coursesT.subject} @@@ ${"IN [" + subjects.reduce((agg, s) => agg + " " + s, "") + "]"}`,
    );
  }

  if (minCourseId) {
    const parsed = parseInt(minCourseId, 10);
    sqlChunks.push(sql`and`);
    sqlChunks.push(
      sql`${coursesT.courseNumber} @@@ ${">= " + String(parsed * 1000)}`,
    );
  }

  if (maxCourseId) {
    const parsed = parseInt(maxCourseId, 10);
    sqlChunks.push(sql`and`);
    sqlChunks.push(
      sql`${coursesT.courseNumber} @@@ ${"<= " + String(parsed * 1000 + 999)}`,
    );
  }

  const result = await db
    .select({
      id: coursesT.id,
      name: coursesT.name,
      courseNumber: coursesT.courseNumber,
      subject: coursesT.subject,
      maxCredits: coursesT.maxCredits,
      minCredits: coursesT.minCredits,
      nupaths: coursesT.nupaths,
      totalSections: countDistinct(sectionsT.id),
      sectionsWithSeats: sql<number>`count(distinct case when ${sectionsT.seatRemaining} > 0 then ${sectionsT.id} end)`,
      campus: sql<string[]>`array_agg(distinct ${sectionsT.campus})`,
      classType: sql<string[]>`array_agg(distinct ${sectionsT.classType})`,
      honors: sql<boolean>`bool_or(${sectionsT.honors})`,
      score: sql<number>`paradedb.score(${coursesT.id})`,
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
      coursesT.nupaths,
    )
    .orderBy(sql`paradedb.score(${coursesT.id}) desc`);

  // filter through the results to find the other filters (not in db index!)
  const processed = result.filter(
    (r) =>
      (nupaths.length === 0 ||
        nupaths
          .map((n) => convertCodeToLiteral(n))
          .every((x) => r.nupaths.includes(x))) &&
      (campusFilter.length === 0 ||
        r.campus.some((x) => campusFilter.includes(x))) &&
      (classTypeFilter.length === 0 ||
        r.classType.some((x) => classTypeFilter.includes(x))) &&
      (!honorsFilter || r.honors),
  );

  return Response.json(processed);
}
