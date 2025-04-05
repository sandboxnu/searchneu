import { coursesTable, sectionsTable, termsTable } from "@/db/schema";
import { scrapeSections } from "@/scraper/scrape";
import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";

// NOTE: This route is special since it should only be called by the Vercel cron service,
// and has custom configuration specified in the `vercel.json` file

export async function GET(req: NextRequest) {
  // check auth to ensure that only the vercel cron service can trigger an update
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // use the direct database connection for increased throughput (write intensive!)
  const db = drizzle(process.env.DATABASE_URL_DIRECT!);

  const term = "202530";

  // TODO: get active terms
  const dbterms = await db
    .select({ term: termsTable.term })
    .from(termsTable)
    .where(gt(termsTable.activeUntil, new Date()));

  const terms = dbterms.map((t) => t.term);
  console.log("terms to update: ", terms);

  // TODO: iterate over those terms and update as needed
  for (let term of terms) {
    console.log("updating term ", term);
    const sections = await scrapeSections(term);

    const prevSections = await db
      .select({
        crn: sectionsTable.crn,
        seatRemaining: sectionsTable.seatRemaining,
        waitRemaining: sectionsTable.waitlistRemaining,
      })
      .from(sectionsTable)
      .innerJoin(coursesTable, eq(coursesTable.id, sectionsTable.courseId))
      .where(eq(coursesTable.term, term));

    const seats: string[] = [];
    const waitlistSeats: string[] = [];

    // PERF: when notif info is added to db, if could be worth only
    // checking the sections people are subbed too

    for (let s of prevSections) {
      const c = sections.find((j) => j.courseReferenceNumber === s.crn);
      if (!c) {
        console.log("section went missing!", s.crn);
        continue;
      }

      if (c.seatsAvailable > 0 && s.seatRemaining === 0) {
        seats.push(s.crn);
      }

      if (c.waitAvailable > 0 && s.waitRemaining === 0) {
        waitlistSeats.push(s.crn);
      }
    }

    let newSections: string[] = [];
    if (prevSections.length !== sections.length) {
      const keys = new Set(prevSections.map((s) => s.crn));

      newSections = sections
        .filter((s) => !keys.has(s.courseReferenceNumber))
        .map((s) => s.courseReferenceNumber);

      // PERF: what about sections that are no longer present?
    }

    // TODO: get subscription info and send notifications
    console.log("Sections with open seats: ", seats);
    console.log("Sections with open waitlist spots: ", waitlistSeats);
    console.log("New sections: ", newSections);

    // update the seat counts in the database
    const values = sections
      .map(
        ({ courseReferenceNumber, seatsAvailable, waitAvailable }) =>
          `('${courseReferenceNumber}', ${seatsAvailable}, ${waitAvailable})`,
      )
      .join(", ");

    // NOTE: this uses a cool postgres feature where multiple rows can be updated
    await db.execute(sql`
    UPDATE ${sectionsTable}
    SET 
      "seatRemaining" = v.seat_remaining,
      "waitlistRemaining" = v.waitlist_remaining
    FROM (VALUES ${sql.raw(values)}) AS v(crn, seat_remaining, waitlist_remaining)
    WHERE ${sectionsTable.crn} = v.crn
  `);
  }

  return Response.json({ success: true });
}
