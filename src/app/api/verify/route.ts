import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  const { phoneNumber } = await req.json();
  setTimeout(() => {
    console.log("Sending verification code to " + phoneNumber);}, 1000);
  return NextResponse.json({
    message: "Verification code sent to " + phoneNumber,
  })
}