import SearchResults from "./searchResults";
import { SearchBar } from "./search";
import { db } from "@/db";
import { coursesT } from "@/db/schema";
import { sql } from "drizzle-orm";

export default async function Page(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = (await props.searchParams)?.q ?? "";
  const term = await props.params.then((p) => p.term);

  // const result = await db
  //   .select({
  //     name: coursesT.name,
  //     courseNumber: coursesT.courseNumber,
  //     subject: coursesT.subject,
  //     description: coursesT.description,
  //     score: sql`paradedb.score(id)`,
  //   })
  //   .from(coursesT)
  //   .where(
  //     sql`${coursesT.id} @@@ paradedb.match('name', ${query}, distance => 0) AND ${coursesT.term} @@@ '202530'`,
  //   )
  //   .orderBy(sql`paradedb.score(id) desc`);

  return (
    <div className="grid grid-cols-2">
      <div className="px-2 py-2">
        <SearchBar />
      </div>
      <div className="py-2 px-2">
        <SearchResults />
      </div>
    </div>
  );
}
