import { coursesT, sectionsT, termsT } from "@/db/schema";
import {
  getSectionFaculty,
  parseMeetingTimes,
  scrapeSections,
} from "@/scraper/scrape";
import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { BannerSection } from "@/scraper/types";

// NOTE: this route is special since it should only be called by the Vercel cron service,
// and has custom configuration specified in the `vercel.json` file

export async function GET(req: NextRequest) {
  // check auth to ensure that only the vercel cron service can trigger an update
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  console.log(req.url);

  // get active terms
  const dbterms = await db
    .select({ term: termsT.term })
    .from(termsT)
    .where(gt(termsT.activeUntil, new Date()));

  const terms = dbterms.map((t) => t.term);
  console.log("terms to update: ", terms);

  // for each term perform an update
  for (const term of terms) {
    console.log("updating term ", term);
    const scrapedSections = await scrapeSections(term);

    const staleSections = await db
      .select({
        crn: sectionsT.crn,
        seatRemaining: sectionsT.seatRemaining,
        waitRemaining: sectionsT.waitlistRemaining,
        courseId: coursesT.id,
        courseNumber: coursesT.courseNumber,
        courseSubject: coursesT.subject,
      })
      .from(sectionsT)
      .leftJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
      .where(eq(coursesT.term, term));

    const seats: BannerSection[] = [];
    const waitlistSeats: BannerSection[] = [];

    // PERF: when notif info is added to db, if could be worth only
    // checking the sections people are subbed too

    const missingSections: string[] = [];
    for (const stale of staleSections) {
      const scrape = scrapedSections.find(
        (j) => j.courseReferenceNumber === stale.crn,
      );

      // PERF: what about sections that are no longer present?
      if (!scrape) {
        missingSections.push(stale.crn);
        continue;
      }

      if (scrape.seatsAvailable > 0 && stale.seatRemaining === 0) {
        seats.push(scrape);
      }

      if (scrape.waitAvailable > 0 && stale.waitRemaining === 0) {
        waitlistSeats.push(scrape);
      }
    }

    let newSections: BannerSection[] = [];
    if (staleSections.length !== scrapedSections.length) {
      const keys = new Set(staleSections.map((s) => s.crn));

      newSections = scrapedSections.filter(
        (s) => !keys.has(s.courseReferenceNumber),
      );
    }

    const courseKeys = newSections.map(
      (s) =>
        staleSections.find(
          (c) =>
            c.courseSubject === s.subject && c.courseNumber === s.courseNumber,
        )?.courseId ?? -1,
    );

    let rootedNewSections = newSections.filter((_, i) => courseKeys[i] !== -1);
    const rootedCourseKeys = courseKeys.filter((k) => k !== -1);

    rootedNewSections = await getSectionFaculty(rootedNewSections);
    const parsedNewSections = rootedNewSections.map((s) => ({
      crn: s.courseReferenceNumber,
      seatCapacity: s.maximumEnrollment,
      seatRemaining: s.seatsAvailable,
      waitlistCapacity: s.waitCapacity,
      waitlistRemaining: s.waitAvailable,
      classType: s.scheduleTypeDescription,
      honors: s.sectionAttributes.some((a) => a.description === "Honors"),
      campus: s.campusDescription,
      meetingTimes: parseMeetingTimes(s),

      faculty: s.f ?? "TBA",
    }));

    if (missingSections) {
      console.log("orphaned sections! ", missingSections);
    }

    if (rootedNewSections.length !== newSections.length) {
      const unrootedSections = newSections.filter(
        (_, i) => courseKeys[i] === -1,
      );
      console.log(
        "unrooted sections! ",
        unrootedSections.map((s) => s.courseReferenceNumber),
      );
    }

    console.log(
      "Sections with open seats: ",
      seats.map((s) => s.courseReferenceNumber),
    );
    console.log(
      "Sections with open waitlist spots: ",
      waitlistSeats.map((s) => s.courseReferenceNumber),
    );
    console.log(
      "New sections: ",
      parsedNewSections.map((s) => s.crn),
    );

    // TODO: get subscription info and send notifications

    // update the seat counts in the database
    const values = seats
      .map(
        ({ courseReferenceNumber, seatsAvailable }) =>
          `('${courseReferenceNumber}', ${seatsAvailable})`,
      )
      .join(", ");

    const waitlistValues = waitlistSeats
      .map(
        ({ courseReferenceNumber, waitAvailable }) =>
          `('${courseReferenceNumber}', ${waitAvailable})`,
      )
      .join(", ");

    // PERF: neon scales to zero before we get here so we have to reconnect. ideally
    // this can be fixed with the pro plan (which we are going to get)
    const dbReconn = drizzle(process.env.DATABASE_URL_DIRECT!);

    // this uses a cool postgres feature where multiple rows can be updated
    if (values.length > 0) {
      await dbReconn.execute(sql`
        UPDATE ${sectionsT}
        SET 
          "seatRemaining" = v.seat_remaining
        FROM (VALUES ${sql.raw(values)}) AS v(crn, seat_remaining)
        WHERE ${sectionsT.crn} = v.crn;
  `);
    }

    if (waitlistValues.length > 0) {
      await dbReconn.execute(sql`
        UPDATE ${sectionsT}
        SET
          "waitlistRemaining" = v.waitlist_remaining
        FROM (VALUES ${sql.raw(waitlistValues)}) AS v(crn, waitlist_remaining)
        WHERE ${sectionsT.crn} = v.crn AND ${sectionsT.term} = ${term};
    `);
    }

    // insert new sections
    if (parsedNewSections.length > 0) {
      await db.insert(sectionsT).values(
        parsedNewSections.map((s, i) => ({
          term: term,
          courseId: rootedCourseKeys[i],
          crn: s.crn,
          faculty: s.faculty,
          seatCapacity: s.seatCapacity,
          seatRemaining: s.seatRemaining,
          waitlistCapacity: s.waitlistCapacity,
          waitlistRemaining: s.waitlistRemaining,
          classType: s.classType,
          honors: s.honors,
          campus: s.campus,
          meetingTimes: s.meetingTimes,
        })),
      );
    }
  }

  return Response.json({ success: true });
}
