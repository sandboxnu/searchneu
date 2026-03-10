import "server-only";
import { betterAuth } from "better-auth";
import { oAuthProxy, openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { schema } from "@sneu/db/neon";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? `https://${process.env.VERCEL_URL}`,
  trustedOrigins: [
    `https://${process.env.VERCEL_URL!}`,
    `https://${process.env.VERCEL_BRANCH_URL!}`,
  ],
  experimental: { joins: true },
  advanced: {
    cookiePrefix: "sneu",
  },
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
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
      redirectURI: `${process.env.BETTER_AUTH_URL ?? "https://searchneu.com"}/api/auth/callback/google`,
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
    oAuthProxy({
      productionURL: process.env.BETTER_AUTH_URL ?? "https://searchneu.com",
    }),
    openAPI({
      disableDefaultReference: true,
    }),
    nextCookies(), // must be last plugin
  ],
});
