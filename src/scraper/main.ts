import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { insertCourseData } from "./db";
import { termsT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TermScrape } from "./types";

const CACHE_PATH = "cache/";
// const TERMS = ["202610", "202530", "202534", "202532"];
const TERMS = ["202610"];
const args = process.argv.splice(2);

(async () => {
  for (const term of TERMS) {
    const cachedTerm = await cacheTerm(term);

    if (args.includes("--dbpush")) {
      await dbPush(term, cachedTerm);
    }
  }
})();

//No flags: prioritizes data in cache; if no data in cache, re-scrapes per missing term.
//--fresh flag: re-creates the entire cache, regardless of prior data existed.
async function cacheTerm(termStr: string) {
  const cachename = path.resolve(CACHE_PATH, `term-${termStr}.json`);
  const existingCache = existsSync(cachename);

  let term;
  if (args.includes("--fresh") || !existingCache) {
    console.log("generating new scrape");
    term = await scrapeTerm(termStr);
    writeFile(cachename, JSON.stringify(term), (err) => {
      if (err) console.log(err);
    });
  } else {
    console.log("existing cache found");
    term = JSON.parse(readFileSync(cachename, "utf8"));
  }
  return term;
}
//if we want to push, use the flag --dbpush
async function dbPush(term: string, cachedTerm: TermScrape) {
  //Database Shenanigans
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

  console.log("connected");

  const existingTerm = await db
    .select({})
    .from(termsT)
    .where(eq(termsT.term, term));

  if (existingTerm.length > 0) {
    console.log("term already exists... skipping");
    console.log("paritally updating terms maybe coming?");
    console.log("it needs to happen but that's so much work rn lowkey");
    return;
  }

  await insertCourseData(cachedTerm, db);
}

