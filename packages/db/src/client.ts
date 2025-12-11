import {
  drizzle as drizzleNeon,
  type NeonHttpQueryResultHKT,
} from "drizzle-orm/neon-http";
import {
  drizzle as drizzlePg,
  type NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { PgDatabase } from "drizzle-orm/pg-core";

/**
 * database type. constructed of either a NeonHttp or NodePg client
 *
 * source: https://github.com/drizzle-team/drizzle-orm/issues/3196#issuecomment-2512446735
 */
export type Database = PgDatabase<
  NodePgQueryResultHKT | NeonHttpQueryResultHKT,
  typeof schema
>;

/**
 * inNeonConnectionString checks if a postgres connection string is for the Neon hosting service
 *
 * @param url connection string
 * @returns whether the connection is for a Neon hosted database
 */
function isNeonConnectionString(url: string) {
  return url.includes("neon.tech") || url.includes("neon://");
}

/**
 * createDb creates a new database connection
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
function createDb(connectionString: string, stripPooler: boolean): Database {
  if (!stripPooler && isNeonConnectionString(connectionString)) {
    return drizzleNeon(neon(connectionString), {
      schema: schema,
    });
  }

  return drizzlePg(connectionString.replace("-pooler", ""), {
    schema: schema,
  });
}

let db: Database | null = null;

/**
 * getDb either gets an existing database client or creates a new one if needed. reusing a single database
 * client for the lifespan of a lambda results in improved performance
 *
 * @param connectionString connection url
 * @param stripPooler whether to strip the pooler from the connection url and connect over tcp directly
 * @returns drizzle db client
 */
export function getDb(
  connectionString?: string,
  stripPooler: boolean = false,
): Database {
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
): Database {
  return createDb(connectionString, stripPoooler);
}

export { schema };
