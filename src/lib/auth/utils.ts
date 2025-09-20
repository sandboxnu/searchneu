import "server-only";

import { createSecretKey } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { config } from "./auth";
import logger from "../logger";

export async function getGuid() {
  const cookieJar = await cookies();
  const jwt = cookieJar.get(config.cookieName)?.value;
  if (!jwt) {
    return null;
  }

  const guid = await verifyJWT(jwt);
  if (!guid) {
    return null;
  }

  return guid;
}

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
    logger.info(e);
    return null;
  }
}
