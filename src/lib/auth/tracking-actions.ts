"use server";

import { cookies } from "next/headers";
import { config } from "../auth";
import { verifyJWT } from "../auth";
import { db } from "@/db";
import { trackersT, usersT } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

async function getGuid() {
  const cookieJar = await cookies();
  const jwt = cookieJar.get(config.cookieName)?.value;
  if (!jwt) {
    return null;
  }

  const guid = await verifyJWT(jwt);
  if (!guid) {
    return null;
  }

  return guid;
}

export async function createTrackerAction(crn: string) {
  const guid = await getGuid();
  if (!guid) {
    const cookieJar = await cookies();
    cookieJar.delete(config.cookieName);

    return { ok: false, msg: "no valid session" };
  }

  const user = await db.query.usersT.findFirst({
    where: eq(usersT.guid, guid),
  });

  if (!user) {
    const cookieJar = await cookies();
    cookieJar.delete(config.cookieName);

    return { ok: false, msg: "no user found matching session" };
  }

  if (!user.phoneNumberVerified)
    return { ok: false, msg: "phone number not verified" };

  const existingTrackers = await db.query.trackersT.findMany({
    where: and(
      eq(trackersT.userId, user.id),
      // eq(trackersT.crn, crn),
      isNull(trackersT.deletedAt),
    ),
  });

  if (user.trackingLimit <= existingTrackers.length)
    return { ok: false, msg: "tracker limit reached" };

  if (existingTrackers.filter((t) => t.crn === crn).length > 0) {
    return { ok: false, msg: "existing tracker found" };
  }

  await db.insert(trackersT).values({
    userId: user.id,
    crn: crn,
  });

  return { ok: true };
}

export async function deleteTrackerAction(crn: string) {
  const guid = await getGuid();
  if (!guid) {
    const cookieJar = await cookies();
    cookieJar.delete(config.cookieName);

    return { ok: false, msg: "no valid session" };
  }

  const user = await db.query.usersT.findFirst({
    where: eq(usersT.guid, guid),
  });

  if (!user) {
    const cookieJar = await cookies();
    cookieJar.delete(config.cookieName);

    return { ok: false, msg: "no user found matching session" };
  }

  await db
    .update(trackersT)
    .set({
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(trackersT.userId, user.id),
        eq(trackersT.crn, crn),
        isNull(trackersT.deletedAt),
      ),
    );

  return { ok: true };
}
