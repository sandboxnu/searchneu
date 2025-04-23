import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  /* config options here */
};

const vercelToolbar = withVercelToolbar();
const mdx = createMDX();

export default mdx(vercelToolbar(nextConfig));
