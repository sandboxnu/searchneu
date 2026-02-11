"use server";

import { headers } from "next/headers";
import { db, trackersT } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "../auth";

export async function createTrackerAction(id: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, msg: "no valid session" };
  }

  if (!session.user.phoneNumberVerified)
    return { ok: false, msg: "phone number not verified" };

  const existingTrackers = await db.query.trackersT.findMany({
    where: and(
      eq(trackersT.userId, session.user.id),
      isNull(trackersT.deletedAt),
    ),
  });

  if (session.user.trackingLimit <= existingTrackers.length)
    return { ok: false, msg: "tracker limit reached" };

  if (existingTrackers.filter((t) => t.sectionId === id).length > 0) {
    return { ok: false, msg: "existing tracker found" };
  }

  await db.insert(trackersT).values({
    userId: session.user.id,
    sectionId: id,
  });

  return { ok: true };
}

export async function deleteTrackerAction(id: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, msg: "no valid session" };
  }

  await db
    .update(trackersT)
    .set({
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(trackersT.userId, session.user.id),
        eq(trackersT.sectionId, id),
        isNull(trackersT.deletedAt),
      ),
    );

  return { ok: true };
}
