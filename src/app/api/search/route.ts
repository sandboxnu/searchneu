import { db } from "@/db";
import { coursesTable } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = params.get("q");

  const result = await db
    .select({
      name: coursesTable.name,
      courseNumber: coursesTable.courseNumber,
      subject: coursesTable.subject,
      score: sql`paradedb.score(id)`,
    })
    .from(coursesTable)
    .where(
      sql`${coursesTable.id} @@@ paradedb.match('name', ${query}, distance => 0)`,
    )
    .orderBy(sql`paradedb.score(id) desc`)
    .limit(20)
    .offset(0);

  return Response.json({ result });
}
