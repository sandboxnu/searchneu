import { defineConfig } from "drizzle-kit";

// @ts-expect-error: NOTE: this file is outside of @sneu/db tsconfig so the node types are not loaded
const connectionString = process.env.DATABASE_URL!;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    // note: creates a direct connection over tcp omitting the connection pooler
    url: connectionString.replace("-pooler", ""),
  },
});
