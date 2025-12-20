import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url);
  const redirectURI = reqUrl.searchParams.get("redirect_uri");

  const cookieJar = await cookies();
  cookieJar.delete("searchneu.session");

  return new Response(null, {
    status: 302,
    headers: {
      location: redirectURI ?? "/",
    },
  });
}
