import "server-only";

import { Google } from "arctic";

export const config = {
  callback:
    process.env.NODE_ENV === "production"
      ? "https://searchNEU.vercel.app/api/auth/callback"
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
