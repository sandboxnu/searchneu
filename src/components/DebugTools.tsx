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
}
