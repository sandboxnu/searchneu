import { db, trackersT, user as usersT } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import twilio from "twilio";

async function findUserByPhoneNumber(fromNumber: string) {
  const [foundUser] = await db
    .select()
    .from(usersT)
    .where(eq(usersT.phoneNumber, fromNumber));

  return foundUser;
}

function sendTwinmlMessage(message: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
    status: 200,
  });
}

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

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { From: fromNumber, Body: messageBody } = params;

  const message = messageBody?.toLowerCase().trim();

  switch (message) {
    case "unsubscribe": {
      const foundUser = await findUserByPhoneNumber(fromNumber);

      if (foundUser) {
        await db
          .update(trackersT)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(trackersT.userId, foundUser.id),
              isNull(trackersT.deletedAt),
            ),
          );

        return sendTwinmlMessage(
          "You have been unsubscribed from all SearchNEU trackers. Start tracking another section to turn notifications back on!",
        );
      }
      break;
    }
    case "stop": {
      const foundUser = await findUserByPhoneNumber(fromNumber);

      if (foundUser) {
        await db
          .update(trackersT)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(trackersT.userId, foundUser.id),
              isNull(trackersT.deletedAt),
            ),
          );

        await db
          .update(usersT)
          .set({ smsOptOut: true })
          .where(eq(usersT.id, foundUser.id));
      }
      break;
    }
    case "start": {
      const foundUser = await findUserByPhoneNumber(fromNumber);

      if (foundUser) {
        await db
          .update(usersT)
          .set({ smsOptOut: false })
          .where(eq(usersT.id, foundUser.id));
      }
      break;
    }
  }

  return new Response(null, { status: 200 });
}
