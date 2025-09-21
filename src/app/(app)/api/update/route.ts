import { coursesT, sectionsT, termsT, trackersT, usersT } from "@/db/schema";
import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { updateTerm } from "@/scraper/update";
import { sendNotifications } from "@/lib/updater/notifs";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  // check auth to ensure that only the vercel cron service can trigger an update
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  logger.info(req.url);

  // get active terms
  const dbterms = await db
    .select({ term: termsT.term })
    .from(termsT)
    .where(gt(termsT.activeUntil, new Date()));

  const terms = dbterms.map((t) => t.term);
  logger.info({ terms }, "terms to update");

  // for each term perform an update
  for (const term of terms) {
    const {
      sectionsWithNewSeats: newSeats,
      sectionsWithNewWaitlistSeats: waitlistSeats,
      newSections,
      newSectionCourseKeys,
    } = await updateTerm(term);

    // get seat trackers & send notifs
    const trackers = await db
      .select({
        id: trackersT.id,
        sectionCrn: sectionsT.crn,
        term: sectionsT.term,
        uid: trackersT.userId,
        method: trackersT.notificationMethod,
        count: trackersT.messageCount,
        limit: trackersT.messageLimit,
        courseSubject: coursesT.subject,
        courseNumber: coursesT.courseNumber,
        phoneNumber: usersT.phoneNumber,
        phoneNumberVerified: usersT.phoneNumberVerified,
      })
      .from(trackersT)
      .innerJoin(sectionsT, eq(sectionsT.id, trackersT.sectionId))
      .innerJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
      .innerJoin(usersT, eq(usersT.id, trackersT.userId))
      .where(eq(sectionsT.term, term));

    const seatCrns = newSeats.map((s) => s.courseReferenceNumber);
    const seatNotifs = trackers.filter((t) => seatCrns.includes(t.sectionCrn));

    const waitlistCrns = waitlistSeats
      .filter((s) => !seatCrns.includes(s.courseReferenceNumber))
      .map((s) => s.courseReferenceNumber);
    const waitlistNotifs = trackers.filter((t) =>
      waitlistCrns.includes(t.sectionCrn),
    );

    await sendNotifications(seatNotifs, waitlistNotifs);

    // update the seat counts in the database
    const values = newSeats
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

    if (newSections.length > 0) {
      await db.insert(sectionsT).values(
        newSections.map((s, i) => ({
          term: term,
          courseId: newSectionCourseKeys[i],
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

    // set the term last updated
    await db
      .update(termsT)
      .set({ updatedAt: new Date() })
      .where(eq(termsT.term, term));
  }

  return Response.json({ success: true });
}
