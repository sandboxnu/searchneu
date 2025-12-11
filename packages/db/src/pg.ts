import {
  drizzle as drizzlePg,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * createDb creates a new database connection
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
function createDb(connectionString: string, stripPooler: boolean) {
  if (stripPooler) {
    return drizzlePg(connectionString.replace("-pooler", ""), {
      schema: schema,
    });
  }

  return drizzlePg(connectionString, {
    schema: schema,
  });
}

let db: NodePgDatabase<typeof schema> | null = null;

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
): NodePgDatabase<typeof schema> {
  return createDb(connectionString, stripPoooler);
}

export { schema };
