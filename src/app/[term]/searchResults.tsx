import { db } from "@/db";
import { coursesT } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function SearchResults(props: { term: string; query: string }) {
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
      sql`${coursesT.id} @@@ paradedb.match('name', ${props.query}, distance => 0) AND ${coursesT.term} @@@ ${props.term}`,
    )
    .orderBy(sql`paradedb.score(id) desc`)
    .limit(200)
    .offset(0);

  return (
    <>
      {result.length > 0 ? (
        <ul className="overflow-y-scroll pt-2">
          {result.map((result, index) => (
            <li
              key={index}
              className="flex flex-col p-2 border-neutral-100 border"
            >
              <div className="flex gap-2 text-lg">
                <h1 className="font-semibold w-28">
                  {result.subject + " " + result.courseNumber}
                </h1>
                <p>{result.name}</p>
              </div>
              {/* <p className="">{result.description}</p> */}
              {/* <p className="text-neutral-500">{result.score}</p> */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No results</p>
      )}
    </>
  );
}
