import type { createDbClient } from "@sneu/db/pg";

type DbClient = ReturnType<typeof createDbClient>;
type TransactionFn = Parameters<DbClient["transaction"]>[0];

/** The drizzle transaction handle passed to each upload step. */
export type Tx = Parameters<TransactionFn>[0];

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
