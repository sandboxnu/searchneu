import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { schema } from "@sneu/db/neon";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  experimental: { joins: true },
  advanced: {
    cookiePrefix: "sneu",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 90, // 90 days
    updateAge: 60 * 60 * 24 * 1, // 1 day (every 1 day the session expiration is updated)
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      hd: "husky.neu.edu",
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: ["user", "sandbox", "admin"],
        defaultValue: "user",
        input: false,
      },
      phoneNumber: {
        type: "string",
      },
      phoneNumberVerified: {
        type: "boolean",
      },
      acceptedTerms: {
        type: "date",
      },
      trackingLimit: {
        type: "number",
        defaultValue: 12,
      },
    },
  },
  plugins: [
    nextCookies(), // must be last plugin
  ],
});
