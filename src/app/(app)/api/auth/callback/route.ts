import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { google } from "@/lib/auth";
import { decodeIdToken, type OAuth2Tokens } from "arctic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieJar = await cookies();
  const storedState = cookieJar.get("gh_oauth_state")?.value ?? null;
  const codeVerifier = cookieJar.get("gh_oauth_codeverify")?.value ?? null;

  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (e) {
    // Invalid code or client credentials
    return new Response(null, {
      status: 400,
    });
  }

  const claims = decodeIdToken(tokens.idToken());
  console.log(claims);

  // TODO:
  // 1) verify hd
  // 2) check if user exixts / onbaord
  // 3) create jwt
  // 4) preserve redirect state throughout
  // 5) oauth proxy

  return new Response(null, {
    status: 302,
    headers: {
      location: "/",
    },
  });
}
