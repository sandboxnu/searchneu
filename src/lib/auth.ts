import "server-only";

import { Google } from "arctic";
import { createSecretKey } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const config = {
  callback:
    process.env.NODE_ENV === "production"
      ? "https://search2-beta.vercel.app/api/auth/callback"
      : "http://localhost:3000/api/auth/callback",
  issuer: "https://searchneu.com",
  cookieName: "searchneu.session",
  expiration: 60 * 60 * 24 * 7 * 7,
  hostedDomain: "husky.neu.edu",
} as const;

export const googleProvider = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  config.callback,
);

export async function createJWT(uid: string) {
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");

  return await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + config.expiration)
    .setIssuer(config.issuer)
    .setAudience(config.issuer)
    .setJti(`${Date.now()}-${Math.random().toString(36).substring(2, 10)}`)
    .sign(secretKey);
}

export async function verifyJWT(token: string) {
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: config.issuer,
      audience: config.issuer,
    });

    const guid = payload.sub;
    if (!guid) {
      return null;
    }

    return guid;
  } catch (e) {
    console.log(e);
    return null;
  }
}
