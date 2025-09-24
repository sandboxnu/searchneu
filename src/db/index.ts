import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

let connectionString = process.env.DATABASE_URL!;

// local postgres proxy configuration
if (!connectionString.includes("neon.tech")) {
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] =
      host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
    return `${protocol}://${host}:${port}/sql`;
  };
}

const sql = neon(connectionString);

export const db = drizzle({
  client: sql,
  schema: schema,
});
