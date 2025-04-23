import { db } from "@/db";
import { userRolesEnum, usersT } from "@/db/schema";
import { getSession } from "@/lib/sessions";
import { eq } from "drizzle-orm";

import Script from "next/script";
import { VercelToolbar } from "@vercel/toolbar/next";

// acts as an override for local
const debug = false;

const debugComps = (
  <>
    <Script
      src="//unpkg.com/react-scan/dist/auto.global.js"
      strategy="beforeInteractive"
      crossOrigin="anonymous"
    />
    <VercelToolbar />
  </>
);

export async function DebugTools() {
  if (debug) {
    return debugComps;
  }

  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await db
    .select({ userId: usersT.userId, role: usersT.role })
    .from(usersT)
    .where(eq(usersT.userId, session.userId as string));

  if (user.length < 1 || user[0].role === userRolesEnum.USER) {
    return null;
  }

  return debugComps;
}
