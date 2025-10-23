import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["typescript", "twoslash"],
  outputFileTracingIncludes: {
    "/content/api/": ["./content/api/*"],
  },
  cacheComponents: true,
  reactCompiler: true,
};

const vercelToolbar = withVercelToolbar();
const mdx = createMDX();

export default mdx(vercelToolbar(nextConfig));
