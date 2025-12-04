import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["typescript"],
  outputFileTracingIncludes: {
    "/content/api/": ["./content/api/*"],
  },
  // cacheComponents: true, /* BUG: unstable for the time being */
  reactCompiler: true,

  async redirects() {
    return [
      {
        source: "/NEU",
        destination: "/",
        statusCode: 307,
      },
      {
        source: "/NEU/:s",
        destination: "/",
        statusCode: 307,
      },
      {
        source: "/CPS",
        destination: "/",
        statusCode: 307,
      },
      {
        source: "/CPS/:s",
        destination: "/",
        statusCode: 307,
      },
      {
        source: "/LAW",
        destination: "/",
        statusCode: 307,
      },
      {
        source: "/LAW/:s",
        destination: "/",
        statusCode: 307,
      },
    ];
  },
};

const vercelToolbar = withVercelToolbar();

export default vercelToolbar(nextConfig);
