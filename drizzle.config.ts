import { defineConfig } from "drizzle-kit";

// HACK: saves from having two db connection strings
let connectionString = process.env.DATABASE_URL!;
if (connectionString.includes("neon.tech")) {
  connectionString.replace("-pooler", "");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
