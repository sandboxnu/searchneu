import { db } from "@/db";
import { userRolesEnum, usersT } from "@/db/schema";
import { getSession } from "@/lib/sessions";
import { eq } from "drizzle-orm";

import Script from "next/script";
import { VercelToolbar } from "@vercel/toolbar/next";
import { reactScanFlag } from "@/lib/flags";

export async function DebugTools() {
  // include React Scan if the flag is enabled
  const reactScan = await reactScanFlag();
  const debugComps = (
    <>
      {reactScan && (
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
        />
      )}
      <VercelToolbar />
    </>
  );

  // if running locally inject the toolbar
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) {
    return debugComps;
  }

  // TODO: might be worth checking if the toolbar is worth
  // injecting in prod or using the browser extension

  // inject the toolbar if the user is an admin
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
