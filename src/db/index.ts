import { drizzle } from "drizzle-orm/neon-http";
import { Twilio } from "twilio";
import * as schema from "./schema";

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema: schema,
});

export const twilio = new Twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
