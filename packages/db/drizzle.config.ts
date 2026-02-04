import { defineConfig } from "drizzle-kit";

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
