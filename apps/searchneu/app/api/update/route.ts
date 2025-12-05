import {
  buildingsT,
  coursesT,
  meetingTimesT,
  roomsT,
  sectionsT,
  termsT,
  trackersT,
  usersT,
} from "@/db/schema";
import { eq, gt, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { updateTerm } from "@/scraper/update";
import { sendNotifications } from "@/lib/updater/notifs";
import { logger } from "@/lib/logger";

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
      sectionsWithUpdatedSeats: updatedSeats,
      sectionsWithNewWaitlistSeats: waitlistSeats,
      sectionsWithUpdatedWaitlistSeats: updatedWaitlistSeats,
      sectionsWithUpdatedSeatCapacity: updatedSeatsCapacity,
      sectionsWithUpdatedWaitlistSeatCapacity: updatedWaitlistCapacity,
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
    const newSeatValues = [...newSeats, ...updatedSeats]
      .map(
        ({ courseReferenceNumber, seatsAvailable }) =>
          `('${courseReferenceNumber}', ${seatsAvailable})`,
      )
      .join(", ");

    const waitlistValues = [...waitlistSeats, ...updatedWaitlistSeats]
      .map(
        ({ courseReferenceNumber, waitAvailable }) =>
          `('${courseReferenceNumber}', ${waitAvailable})`,
      )
      .join(", ");

    const newSeatsCapacity = updatedSeatsCapacity
      .map(
        ({ courseReferenceNumber, maximumEnrollment }) =>
          `('${courseReferenceNumber}', ${maximumEnrollment})`,
      )
      .join(", ");

    const newWaitlistCapacity = updatedWaitlistCapacity
      .map(
        ({ courseReferenceNumber, waitCapacity }) =>
          `('${courseReferenceNumber}', ${waitCapacity})`,
      )
      .join(", ");

    if (newSeatValues.length > 0) {
      await db.execute(sql`
        UPDATE ${sectionsT}
        SET 
          "seatRemaining" = v.seat_remaining
        FROM (VALUES ${sql.raw(newSeatValues)}) AS v(crn, seat_remaining)
        WHERE ${sectionsT.crn} = v.crn;
  `);
    }

    if (waitlistValues.length > 0) {
      await db.execute(sql`
        UPDATE ${sectionsT}
        SET
          "waitlistRemaining" = v.waitlist_remaining
        FROM (VALUES ${sql.raw(waitlistValues)}) AS v(crn, waitlist_remaining)
        WHERE ${sectionsT.crn} = v.crn AND ${sectionsT.term} = ${term};
    `);
    }

    if (newSeatsCapacity.length > 0) {
      console.log("NEW SEATS CAPACITY", newSeatsCapacity);
      await db.execute(sql`
        UPDATE ${sectionsT}
        SET
          "seatCapacity" = v.seat_capacity
        FROM (VALUES ${sql.raw(newSeatsCapacity)}) AS v(crn, seat_capacity)
        WHERE ${sectionsT.crn} = v.crn AND ${sectionsT.term} = ${term};
    `);
    }

    if (newWaitlistCapacity.length > 0) {
      await db.execute(sql`
        UPDATE ${sectionsT}
        SET
          "waitlistCapacity" = v.waitlist_capacity
        FROM (VALUES ${sql.raw(newWaitlistCapacity)}) AS v(crn, waitlist_capacity)
        WHERE ${sectionsT.crn} = v.crn AND ${sectionsT.term} = ${term};
    `);
    }

    if (newSections.length > 0) {
      const sections = await db
        .insert(sectionsT)
        .values(
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
        )
        .returning();

      const meetingTimesData = [];

      for (let i = 0; i < newSections.length; i++) {
        const section = sections[i];
        const meetingTimes = newSections[i].meetingTimes;
        for (const mt of meetingTimes) {
          let roomId = null;

          if (mt.building && mt.room) {
            const room = await db
              .select({
                roomId: roomsT.id,
              })
              .from(roomsT)
              .innerJoin(buildingsT, eq(buildingsT.id, roomsT.buildingId))
              .where(
                and(
                  eq(roomsT.number, mt.room),
                  eq(buildingsT.name, mt.building),
                ),
              )
              .limit(1);
            roomId = room[0].roomId;
          }
          if (mt.startTime && mt.endTime) {
            meetingTimesData.push({
              term: term,
              sectionId: section.id,
              roomId: roomId,
              days: mt.days,
              startTime: mt.startTime,
              endTime: mt.endTime,
            });
          }
        }
      }

      if (meetingTimesData.length > 0) {
        await db
          .insert(meetingTimesT)
          .values(meetingTimesData)
          .onConflictDoNothing();
      }
    }

    // set the term last updated
    await db
      .update(termsT)
      .set({ updatedAt: new Date() })
      .where(eq(termsT.term, term));
  }

  return Response.json({ success: true });
}
