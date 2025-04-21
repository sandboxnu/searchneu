import { NextRequest, NextResponse } from "next/server";
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;

import twilioClient from "../twilio";

// start verificaiton, send request to twilio server to send sms code
export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  const {verificationCode,phoneNumber } = await req.json();
  if(!TWILIO_VERIFY_SID) return NextResponse.json({
    message: "TWILIO_VERIFY_SID not set in .env file"
  })

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verificationChecks.create({
        code: verificationCode,
        to: phoneNumber,
      });
    
    if (verificationCheck.status === "approved") {
      return NextResponse.json({
        status: "approved",
      });
    }
    
    return NextResponse.json({
      status: verificationCheck.status,
    });
  } catch (err) {
    console.error("Error confirming verification code: ", err);
    return NextResponse.json({
      message: "Error confirming verification code: ", 
      error: err
    });
  }
}