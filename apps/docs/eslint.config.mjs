import { config } from "@sneu/eslint-config/next-js";

const eslintConfig = [...config, { ignores: [".source/**"] }];

/** @type {import("eslint").Linter.Config} */
export default eslintConfig;
