"use server";
import { db, twilio } from "@/db";
import { usersT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "../sessions";

export async function sendVerificationText(phone: string) {
  try {
    await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!) // NOTE: maybe pull out env var
      .verifications.create({ to: phone, channel: "sms" });

    return { statusCode: 200, message: "Verification code sent!" };
  } catch (err) {
    // @ts-expect-error twilio has weird types (aka no types lol)
    switch (err.code) {
      case 60205: // sms not enabled for landline https://www.twilio.com/docs/api/errors/60205
        return {
          statusCode: 400,
          message: "SMS is not supported by landline",
        };
      case 60200: // incorrect send number https://www.twilio.com/docs/api/errors/60200
        return {
          statusCode: 400,
          message: "Invalid phone number",
        };
      case 60203: // send too many code (max of 5) https://www.twilio.com/docs/api/errors/60202
        return {
          statusCode: 400,
          message:
            "You've attempted to send the verification code too many times. Either verify your code or wait 10 minutes for the verification code to expire.",
        };
      default:
        console.error("error sending verification text");
        throw err;
    }
  }
}

export async function checkVerificationCode(phone: string, code: string) {
  try {
    const check = await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!) // NOTE: maybe pull out env var
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    if (check.status !== "approved") {
      return { status: check.status };
    }

    const user = await db
      .select({ uid: usersT.userId })
      .from(usersT)
      .where(eq(usersT.phoneNumber, phone));

    let userId = user[0]?.uid;
    if (user.length === 0) {
      const newUser = await db
        .insert(usersT)
        .values({
          phoneNumber: phone,
          plan: 1,
        })
        .returning({ uid: usersT.userId });

      userId = newUser[0].uid;
    }

    await createSession(userId);
    return { status: "approved", uid: userId };
  } catch (err) {
    console.error("error confirming verification code");
    throw err;
  }
}
