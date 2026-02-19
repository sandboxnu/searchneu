import { eq, sql } from "drizzle-orm";
import type { createDbClient } from "@sneu/db/pg";
import { notificationsT, trackersT } from "@sneu/db/schema";

export interface Notif {
  id: number;
  term: string;
  sectionCrn: string;
  uid: string;
  method: string;
  count: number;
  limit: number;
  courseSubject: string;
  courseNumber: string;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
}

export interface NotificationSender {
  sendSMS(to: string, message: string): Promise<void>;
}

export async function sendNotifications(
  seatNotifs: Notif[],
  waitlistNotifs: Notif[],
  db: ReturnType<typeof createDbClient>,
  sender: NotificationSender,
  logger?: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string, err?: Error) => void;
  },
) {
  const log = logger ?? console;

  const seatMessages = seatNotifs.map(
    (n) =>
      `A seat opened up in ${n.courseSubject} ${n.courseNumber} (CRN: ${n.sectionCrn}). Check it out at https://searchneu.com/catalog/${n.term}/${n.courseSubject}%20${n.courseNumber} !`,
  );
  const waitlistMessages = waitlistNotifs.map(
    (n) =>
      `A waitlist seat has opened up in ${n.courseSubject} ${n.courseNumber} (CRN: ${n.sectionCrn}). Check it out at https://searchneu.com/catalog/${n.term}/${n.courseSubject}%20${n.courseNumber} !`,
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

    await sender
      .sendSMS(t.phoneNumber, messages[i])
      .then(() => {
        log.info(`Sent notification text to ${t.phoneNumber}`);

        db.insert(notificationsT)
          .values({
            userId: t.uid,
            trackerId: t.id,
            method: "SMS",
            message: messages[i],
          })
          .catch((err) => log.error("failed to log notification", err));

        db.update(trackersT)
          .set({
            messageCount: sql`${trackersT.messageCount} + 1`,
            deletedAt: t.count + 1 >= t.limit ? new Date() : null,
          })
          .where(eq(trackersT.id, t.id))
          .catch((err) => log.error("failed to update message count", err));
      })
      .catch(async (err) => {
        switch (err.code) {
          case 21610:
            log.warn(`${t.phoneNumber} has unsubscribed from notifications`);

            // if a user has blocked the twilio number, unsub them from
            // all trackers
            await db
              .update(trackersT)
              .set({ deletedAt: new Date() })
              .where(eq(trackersT.userId, t.uid));

            return;
          default:
            log.error(
              `Error trying to send notification text to ${t.phoneNumber}`,
              err,
            );
        }
      });
  }
}
