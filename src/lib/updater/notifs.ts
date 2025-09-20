import { db } from "@/db";
import { twilio } from "../twilio";
import { notificationsT, trackersT } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import logger from "../logger";

interface Notif {
  id: number;
  term: string;
  sectionCrn: string;
  uid: number;
  method: string;
  count: number;
  limit: number;
  courseSubject: string;
  courseNumber: string;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
}

export async function sendNotifications(
  seatNotifs: Notif[],
  waitlistNotifs: Notif[],
) {
  const seatMessages = seatNotifs.map(
    (n) =>
      `A seat opened up in ${n.courseSubject} ${n.courseNumber} (CRN: ${n.sectionCrn}). Check it out at https://search2-beta.vercel.app/catalog/${n.term}/${n.courseSubject}%20${n.courseNumber} !`,
  );
  const waitlistMessages = waitlistNotifs.map(
    (n) =>
      `A waitlist seat has opened up in ${n.courseSubject} ${n.courseNumber} (CRN: ${n.sectionCrn}). Check it out at https://search2-beta.vercel.app/catalog/${n.term}/${n.courseSubject}%20${n.courseNumber} !`,
  );
  const messages = [...seatMessages, ...waitlistMessages];
  const notifs = [...seatNotifs, ...waitlistNotifs];

  for (let i = 0; i < notifs.length; i++) {
    const t = notifs[i];

    if (!t.phoneNumber || !t.phoneNumberVerified) {
      continue;
    }

    if (t.count >= t.limit) {
      db.update(trackersT)
        .set({ deletedAt: new Date() })
        .where(eq(trackersT.id, t.id));

      continue;
    }

    await twilio.messages
      .create({
        body: messages[i],
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: t.phoneNumber,
      })

      .then(() => {
        logger.info(`Sent notification text to ${t.phoneNumber}`);

        db.insert(notificationsT)
          .values({
            userId: t.uid,
            trackerId: t.id,
            method: "SMS",
            message: messages[i],
          })
          .catch((err) => logger.error("failed to log notification", err));

        db.update(trackersT)
          .set({
            messageCount: sql`${trackersT.messageCount} + 1`,
            deletedAt: t.count + 1 >= t.limit ? new Date() : null,
          })
          .where(eq(trackersT.id, t.id))
          .catch((err) => logger.error("failed to update message count", err));
      })
      .catch(async (err) => {
        switch (err.code) {
          case 21610:
            logger.warn(
              `${t.phoneNumber} has unsubscribed from notifications`,
            );

            // if a user has blocked the twilio number, unsub them from
            // all trackers
            await db
              .update(trackersT)
              .set({ deletedAt: new Date() })
              .where(eq(trackersT.userId, t.uid));

            return;
          default:
            logger.error(
              `Error trying to send notification text to ${t.phoneNumber}`,
              err,
            );
        }
      });
  }
}
