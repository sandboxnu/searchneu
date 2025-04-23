import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  /* config options here */
};

const vercelToolbar = withVercelToolbar();

export default vercelToolbar(nextConfig);
