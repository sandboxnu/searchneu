import { notificationsT, trackersT } from "@sneu/db/schema";
import { eq, sql } from "drizzle-orm";
import { renderMessage } from "./templates";
import type { Logger, NotificationProvider, TypedNotif } from "./types";

const defaultLogger: Logger = {
  info: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
  error: (msg, err) => console.error(msg, err),
};

export async function sendNotifications(
  notifications: TypedNotif[],
  db: any,
  provider: NotificationProvider,
  logger: Logger = defaultLogger,
): Promise<void> {
  for (const { notif, type } of notifications) {
    if (!notif.phoneNumber || !notif.phoneNumberVerified) {
      continue;
    }

    if (notif.count >= notif.limit) {
      await db
        .update(trackersT)
        .set({ deletedAt: new Date() })
        .where(eq(trackersT.id, notif.id));
      continue;
    }

    const message = renderMessage(type, notif);

    try {
      await provider.send(notif.phoneNumber, message);

      logger.info(`Sent notification to ${notif.phoneNumber}`);

      await db
        .insert(notificationsT)
        .values({
          userId: notif.uid,
          trackerId: notif.id,
          method: provider.method,
          message,
        })
        .catch((err: unknown) =>
          logger.error("failed to log notification", err),
        );

      await db
        .update(trackersT)
        .set({
          messageCount: sql`${trackersT.messageCount} + 1`,
          deletedAt: notif.count + 1 >= notif.limit ? new Date() : null,
        })
        .where(eq(trackersT.id, notif.id))
        .catch((err: unknown) =>
          logger.error("failed to update message count", err),
        );
    } catch (err: any) {
      if (err.code === 21610) {
        logger.warn(
          `${notif.phoneNumber} has unsubscribed from notifications`,
        );

        await db
          .update(trackersT)
          .set({ deletedAt: new Date() })
          .where(eq(trackersT.userId, notif.uid));
      } else {
        logger.error(
          `Error trying to send notification to ${notif.phoneNumber}`,
          err,
        );
      }
    }
  }
}
