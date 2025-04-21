import { NextRequest, NextResponse } from "next/server";
import twilioClient from "./twilio";
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;

// start verificaiton, send request to twilio server to send sms code
export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  const { phoneNumber } = await req.json();
  if(!TWILIO_VERIFY_SID) return NextResponse.json({
    message: "TWILIO_VERIFY_SID not set in .env file"
  })

  try{

  return twilioClient.verify.v2.services(TWILIO_VERIFY_SID)
  .verifications
        .create({to: phoneNumber, channel: 'sms'})
      .then(verification => {
  return NextResponse.json({
    verificationCode: verification.sid,
  })})

  }catch(err) {
    console.error("Error sending verification code: ", err);
    return NextResponse.json({
      message: "Error sending verification code",
    });
  }
}
