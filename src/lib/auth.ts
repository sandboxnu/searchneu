import "server-only";

import { Google } from "arctic";
import { createSecretKey } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const config = {
  callback: "",
} as const;

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  "http://localhost:3000/api/auth/callback",
);

export async function createJWT(uid: string, exp: number) {
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");

  return await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + exp)
    .setIssuer("https://searchneu.com")
    .setAudience("https://searchneu.com")
    .setJti("")
    .sign(secretKey);
}

export async function verifyJWT(token: string) {
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "https://searchneu.com",
      audience: "https://searchneu.com",
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
