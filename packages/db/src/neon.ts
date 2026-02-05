import {
  drizzle as drizzleNeon,
  NeonHttpDatabase,
} from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * createDb creates a new database connection
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
function createDb(connectionString: string, stripPooler: boolean) {
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] =
      host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
    return `${protocol}://${host}:${port}/sql`;
  };

  if (stripPooler) {
    return drizzleNeon(neon(connectionString.replace("-pooler", "")), {
      schema: schema,
    });
  }

  return drizzleNeon(neon(connectionString), {
    schema: schema,
  });
}

let db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * getDb either gets an existing database client or creates a new one if needed. reusing a single database
 * client for the lifespan of a lambda results in improved performance
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
export function getDb(connectionString?: string, stripPooler: boolean = false) {
  const url = connectionString ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Either set it or pass a connection string to getDb().",
    );
  }

  if (!db) {
    db = createDb(url, stripPooler);
  }

  return db;
}

/**
 * createDbClient explicitly creates a new database client
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
export function createDbClient(
  connectionString: string,
  stripPoooler: boolean = false,
) {
  return createDb(connectionString, stripPoooler);
}

export { schema };
