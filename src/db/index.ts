import { drizzle } from "drizzle-orm/neon-http";

export const db = drizzle({
  connection: process.env.DATABASE_URL ?? "",
  casing: "snake_case",
});
