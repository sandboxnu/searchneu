import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import { insertCourseData } from "@/scraper/db";
import { termsT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TermScrape } from "@/scraper/types";
import { Config } from "@/scraper/types";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;

void (async () => {
  const configStream = readFileSync(path.resolve(CACHE_PATH, "manifest.yaml"), {
    encoding: "utf8",
  });
  const config = parse(configStream) as Config;

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

  for (const term of config.terms) {
    const cachename = path.resolve(
      CACHE_PATH,
      CACHE_FORMAT(term.term.toString()),
    );
    const existingCache = readFileSync(cachename, { encoding: "utf8" });
    const cache = JSON.parse(existingCache) as TermScrape;

    console.log("connected");

    const existingTerm = await db
      .select({})
      .from(termsT)
      .where(eq(termsT.term, term.term.toString()));

    if (existingTerm.length > 0) {
      console.log("term already exists... skipping");
      console.log("paritally updating terms maybe coming?");
      console.log("it needs to happen but that's so much work rn lowkey");
      return;
    }

    await insertCourseData(cache, config, db);
  }
})();
