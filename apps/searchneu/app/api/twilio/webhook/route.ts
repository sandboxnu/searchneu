import { db, trackersT, user as usersT } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const url = req.url;
  const rawBody = await req.text();
  const twilioSignature = req.headers.get("x-twilio-signature") ?? "";
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const isValid = twilio.validateRequest(
    authToken,
    twilioSignature,
    url,
    params,
  );
  console.log("IS VALID", isValid);

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { From: fromNumber, Body: messageBody } = params;

  if (messageBody?.toLowerCase().trim() === "unsubscribe") {
    const [foundUser] = await db
      .select()
      .from(usersT)
      .where(eq(usersT.phoneNumber, fromNumber));

    if (foundUser) {
      await db
        .update(trackersT)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(trackersT.userId, foundUser.id), isNull(trackersT.deletedAt)),
        );

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(
        "You have been unsubscribed from all SearchNEU trackers. Start tracking another section to turn notifications back on!",
      );

      return new Response(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
        status: 200,
      });
    }
  }

  return new Response(null, { status: 200 });
}
