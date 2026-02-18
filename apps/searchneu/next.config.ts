import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["typescript"],
  pageExtensions: ["ts", "tsx", "js", "jsx", "mdx", "md"],
  outputFileTracingIncludes: {
    "/content/api/": ["./content/api/*"],
  },
  // cacheComponents: true, /* BUG: unstable for the time being */
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/graduate/:path*",
        destination: "https://api.graduatenu.com/api/:path*",
      },
    ];
  },

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
const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

export default vercelToolbar(withMDX(nextConfig));
