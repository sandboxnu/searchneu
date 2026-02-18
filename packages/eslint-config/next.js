import { config as baseConfig } from "./base.js";
import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint configuration for NextJS applications
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,

  // nextjs specific rules
  ...nextVitals,
  ...nextTs,

  // ignore build outputs
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
];
