import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { insertCourseData } from "./db";
import { termsT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const CACHE_PATH = "cache/";
// const TERMS = ["202610", "202530", "202534", "202532"];
const TERMS = ["202610"];

// always assume this file is only every called directy
(async () => {
  for (const term of TERMS) {
    await main(term);
  }
})();

async function main(m: string) {
  const cachename = path.resolve(CACHE_PATH, `term-${m}.json`);
  const existingCache = existsSync(cachename);

  let term;
  if (existingCache) {
    logger.info("existing cache found");
    term = JSON.parse(readFileSync(cachename, "utf8"));
  } else {
    logger.info("generating new scrape");
    term = await scrapeTerm(m);

    writeFile(cachename, JSON.stringify(term), (err) => {
      if (err) logger.error(err);
    });
  }

  const projectDir = process.cwd();
  loadEnvConfig(projectDir);

  // HACK: saves from having two db connection strings
  const connectionString = process.env.DATABASE_URL!;
  if (connectionString.includes("neon.tech")) {
    connectionString.replace("-pooler", "");
  }

  const db = drizzle({
    connection: connectionString,
    schema: schema,
  });

  logger.info("connected");

  const existingTerm = await db
    .select({})
    .from(termsT)
    .where(eq(termsT.term, m));

  if (existingTerm.length > 0) {
    logger.info("term already exists... skipping");
    logger.info("paritally updating terms maybe coming?");
    logger.info("it needs to happen but that's so much work rn lowkey");
    return;
  }

  await insertCourseData(term, db);
}
