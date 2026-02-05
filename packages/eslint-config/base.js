import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
// import onlyWarn from "eslint-plugin-only-warn";

/**
 * shared ESLint configuration
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,

  // ignore build outputs
  globalIgnores(["dist/**"]),
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  // NOTE: this is an option if we want warnings instead of errors
  // {
  //   plugins: {
  //     onlyWarn,
  //   },
  // },
];
