import { db } from "@/db";
import { coursesT } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = params.get("q");
  // const numResults = params.get("count");
  // const offset = params.get("offset");
  console.log(query);

  // NOTE: this should probably be a cte rather than add to the index?
  const result = await db
    .select({
      name: coursesT.name,
      courseNumber: coursesT.courseNumber,
      subject: coursesT.subject,
      description: coursesT.description,
      score: sql`paradedb.score(id)`,
    })
    .from(coursesT)
    .where(
      sql`${coursesT.id} @@@ paradedb.match('name', ${query}, distance => 0) AND ${coursesT.term} @@@ '202530'`,
    )
    .orderBy(sql`paradedb.score(id) desc`);
  // .limit(200)
  // .offset(0);

  return Response.json({ result });
}
