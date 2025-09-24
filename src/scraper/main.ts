import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { insertCourseData } from "./db";
import { termsT } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    console.log("existing cache found");
    term = JSON.parse(readFileSync(cachename, "utf8"));
  } else {
    console.log("generating new scrape");
    term = await scrapeTerm(m);

    writeFile(cachename, JSON.stringify(term), (err) => {
      if (err) console.log(err);
    });
  }

  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
  const db = drizzle({
    connection: process.env.DATABASE_URL_DIRECT!,
    schema: schema,
  });

  console.log("connected");

  const existingTerm = await db
    .select({})
    .from(termsT)
    .where(eq(termsT.term, m));

  if (existingTerm.length > 0) {
    console.log("term already exists... skipping");
    console.log("paritally updating terms maybe coming?");
    console.log("it needs to happen but that's so much work rn lowkey");
    return;
  }

  await insertCourseData(term, db);
}
