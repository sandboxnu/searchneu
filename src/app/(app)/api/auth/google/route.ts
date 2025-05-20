import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { google } from "@/lib/auth";

export async function GET() {
  const cookieJar = await cookies();

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  url.searchParams.set("hd", "husky.neu.edu");

  cookieJar.set("gh_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookieJar.set("gh_oauth_codeverify", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}
