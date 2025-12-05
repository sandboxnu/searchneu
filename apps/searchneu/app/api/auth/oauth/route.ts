import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { config, googleProvider } from "@/lib/auth/auth";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url);
  const redirectURI = reqUrl.searchParams.get("redirect_uri") ?? "/";
  const cookieJar = await cookies();

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];
  const url = googleProvider.createAuthorizationURL(
    state,
    codeVerifier,
    scopes,
  );

  url.searchParams.set("hd", config.hostedDomain);

  cookieJar.set("goa_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookieJar.set("goa_codeverify", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookieJar.set("goa_redirecturi", redirectURI, {
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
