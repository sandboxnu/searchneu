/** A notification promises a seat the catalog can already serve. */

import twilio from "twilio";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  coursesT,
  sectionsT,
  subjectsT,
  termsT,
  trackersT,
  user as usersT,
} from "@sneu/db/schema";
import { sendNotifications, type Notif } from "@sneu/scraper/notifs";
import type { Changeset } from "@sneu/scraper/ingest";
import type { getDb } from "@sneu/db/pg";

type Db = ReturnType<typeof getDb>;

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sender = {
  async sendSMS(to: string, message: string): Promise<void> {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });
  },
};

export async function notify(
  db: Db,
  changeset: Changeset,
): Promise<{ seat: number; waitlist: number }> {
  const seatIds = changeset.seatOpened.map((s) => s.sectionId);
  const waitlistIds = changeset.waitlistOpened.map((s) => s.sectionId);
  if (seatIds.length === 0 && waitlistIds.length === 0) {
    return { seat: 0, waitlist: 0 };
  }

  const trackers = await activeTrackers(db, [...seatIds, ...waitlistIds]);

  const seatSet = new Set(seatIds);
  const seatNotifs = trackers.filter((t) => seatSet.has(t.sectionId));
  const waitlistSet = new Set(waitlistIds);
  const waitlistNotifs = trackers.filter((t) => waitlistSet.has(t.sectionId));

  await sendNotifications(seatNotifs, waitlistNotifs, db, sender, {
    info: (msg) => console.log(JSON.stringify({ msg })),
    warn: (msg) => console.log(JSON.stringify({ msg })),
    error: (msg, err) =>
      console.error(JSON.stringify({ msg, error: String(err) })),
  });

  return { seat: seatNotifs.length, waitlist: waitlistNotifs.length };
}

async function activeTrackers(
  db: Db,
  sectionIds: number[],
): Promise<(Notif & { sectionId: number })[]> {
  return db
    .select({
      id: trackersT.id,
      sectionId: trackersT.sectionId,
      sectionCrn: sectionsT.crn,
      term: termsT.term,
      uid: trackersT.userId,
      method: trackersT.notificationMethod,
      count: trackersT.messageCount,
      limit: trackersT.messageLimit,
      courseSubject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      phoneNumber: usersT.phoneNumber,
      phoneNumberVerified: usersT.phoneNumberVerified,
    })
    .from(trackersT)
    .innerJoin(sectionsT, eq(sectionsT.id, trackersT.sectionId))
    .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
    .innerJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .innerJoin(usersT, eq(usersT.id, trackersT.userId))
    .where(
      and(
        inArray(trackersT.sectionId, sectionIds),
        isNull(trackersT.deletedAt),
      ),
    );
}
