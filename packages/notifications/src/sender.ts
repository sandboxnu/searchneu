import { eq, sql } from "drizzle-orm";
import { notificationsT, trackersT } from "@sneu/db/schema";
import type { TypedNotif, NotificationProvider, Logger } from "./types";
import { renderMessage } from "./templates";

export async function sendNotifications(
  notifications: TypedNotif[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  provider: NotificationProvider,
  logger?: Logger,
): Promise<void> {
  const log = logger ?? console;

  for (const { notif: t, type } of notifications) {
    if (!t.phoneNumber || !t.phoneNumberVerified) continue;

    if (t.count >= t.limit) {
      await db
        .update(trackersT)
        .set({ deletedAt: new Date() })
        .where(eq(trackersT.id, t.id));
      continue;
    }

    const message = renderMessage(type, t);

    try {
      await provider.send(t.phoneNumber, message);
      log.info(`Sent ${provider.method} notification to ${t.phoneNumber}`);

      db.insert(notificationsT)
        .values({
          userId: t.uid,
          trackerId: t.id,
          method: provider.method,
          message,
        })
        .catch((err: unknown) =>
          log.error("failed to log notification", err),
        );

      db.update(trackersT)
        .set({
          messageCount: sql`${trackersT.messageCount} + 1`,
          deletedAt: t.count + 1 >= t.limit ? new Date() : null,
        })
        .where(eq(trackersT.id, t.id))
        .catch((err: unknown) =>
          log.error("failed to update message count", err),
        );
    } catch (err: any) {
      if (err.code === 21610) {
        log.warn(
          `${t.phoneNumber} has unsubscribed from notifications`,
        );
        await db
          .update(trackersT)
          .set({ deletedAt: new Date() })
          .where(eq(trackersT.userId, t.uid));
      } else {
        log.error(
          `Error sending ${provider.method} notification to ${t.phoneNumber}`,
          err,
        );
      }
    }
  }
}
