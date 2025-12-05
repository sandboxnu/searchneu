import { Twilio } from "twilio";

export const twilio = new Twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
