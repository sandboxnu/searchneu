"use server";

import { cookies } from "next/headers";
import { config } from "../auth/auth";
import { verifyJWT } from "../auth/utils";
import { db, usersT } from "@/lib/db";
import { eq } from "drizzle-orm";
import { twilio } from "../twilio";
import { logger } from "../logger";

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

export async function grantConsentAction() {
  const guid = await getGuid();
  if (!guid) {
    return { ok: false };
  }

  await db
    .update(usersT)
    .set({ acceptedTerms: new Date() })
    .where(eq(usersT.guid, guid));

  return {
    ok: true,
  };
}

export async function startPhoneVerificationAction(phoneNumber: string) {
  const guid = await getGuid();
  if (!guid) {
    return { ok: false };
  }

  logger.info(phoneNumber);

  if (phoneNumber.length !== 12 || phoneNumber.substring(0, 2) !== "+1") {
    return {
      ok: false,
      msg: "Non US / CA numbers not currently supported",
    };
  }

  try {
    await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: phoneNumber, channel: "sms" });

    await db
      .update(usersT)
      .set({ phoneNumber: phoneNumber })
      .where(eq(usersT.guid, guid));

    return { ok: true };
  } catch (err) {
    // @ts-expect-error twilio has weird types (aka no types lol)
    switch (err.code) {
      case 60205: // sms not enabled for landline https://www.twilio.com/docs/api/errors/60205
        return {
          ok: false,
          msg: "SMS is not supported by landline",
        };
      case 60200: // incorrect send number https://www.twilio.com/docs/api/errors/60200
        return {
          ok: false,
          msg: "Invalid phone number",
        };
      case 60203: // send too many code (max of 5) https://www.twilio.com/docs/api/errors/60202
        return {
          ok: false,
          msg: "You've attempted to send the verification code too many times. Either verify your code or wait 10 minutes for the verification code to expire.",
        };
      default:
        logger.error("error sending verification text");
        throw err;
    }
  }
}

export async function verifyPhoneAction(phoneNumber: string, code: string) {
  const guid = await getGuid();
  if (!guid) {
    return { ok: false };
  }

  try {
    const check = await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    if (check.status !== "approved") {
      return { ok: false, status: check.status };
    }

    await db
      .update(usersT)
      .set({ phoneNumberVerified: true })
      .where(eq(usersT.guid, guid));

    return { ok: true };
  } catch (err) {
    logger.error("error confirming verification code");
    throw err;
  }
}
