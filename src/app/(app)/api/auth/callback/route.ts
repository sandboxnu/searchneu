import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { config, googleProvider } from "@/lib/auth/auth";
import { createJWT } from "@/lib/auth/utils";
import { decodeIdToken, type OAuth2Tokens } from "arctic";
import { db } from "@/db";
import { usersT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import logger from "@/lib/logger";

interface GoogleOauthClaims {
  sub: string;
  hd: string;
  name: string;
  email: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieJar = await cookies();
  const storedState = cookieJar.get("goa_state")?.value ?? null;
  const codeVerifier = cookieJar.get("goa_codeverify")?.value ?? null;
  const redirectURI = cookieJar.get("goa_redirecturi")?.value ?? null;

  cookieJar.delete("goa_state");
  cookieJar.delete("goa_codeverify");
  cookieJar.delete("goa_redirecturi");

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
    tokens = await googleProvider.validateAuthorizationCode(code, codeVerifier);
  } catch (e) {
    logger.info(e)

    // Invalid code or client credentials
    return new Response(null, {
      status: 400,
    });
  }

  const claims = decodeIdToken(tokens.idToken()) as GoogleOauthClaims;

  if (claims.hd !== config.hostedDomain) {
    return new Response(null, {
      status: 400,
    });
  }

  let users = await db
    .select({
      id: usersT.id,
      guid: usersT.guid,
    })
    .from(usersT)
    .where(eq(usersT.subject, claims.sub));

  let needsOnboarding = false;
  if (users.length === 0) {
    needsOnboarding = true;

    users = await db
      .insert(usersT)
      .values({
        guid: randomUUID(),
        subject: claims.sub,
        name: claims.name,
        email: claims.email,
        image: claims.picture,
      })
      .returning({
        id: usersT.id,
        guid: usersT.guid,
      });
  }

  const user = users[0];

  const jwt = await createJWT(user.guid);
  cookieJar.set(config.cookieName, jwt, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: config.expiration,
  });

  // TODO: oauth proxy

  if (needsOnboarding) {
    const params = new URLSearchParams();
    params.set("redirect_uri", redirectURI ?? "/");

    return new Response(null, {
      status: 302,
      headers: {
        location: `/me/link?${params.toString()}`,
      },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: redirectURI ?? "/",
    },
  });
}
