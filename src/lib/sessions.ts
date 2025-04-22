import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const iat = Date.now();
  const exp = new Date(iat + 1000 * 60 * 60 * 24 * 30);

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setNotBefore(iat)
    .setSubject(userId)
    .sign(secret);

  cookieStore.set("searchneu.session", token, {
    httpOnly: true,
    secure: true,
    expires: exp,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  try {
    const token = cookieStore.get("searchneu.session");
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, secret);

    return payload;
  } catch {
    return null;
  }
}
