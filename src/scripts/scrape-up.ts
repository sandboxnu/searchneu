import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import { insertTermData, insertConfigData } from "@/scraper/db";
import { TermScrape } from "@/scraper/types";
import { Config } from "@/scraper/types";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    terms: [] as string[],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--all") {
      options.all = true;
    } else if (arg === "--terms" && i + 1 < args.length) {
      options.terms = args[i + 1].split(",").map((t) => t.trim());
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: npm run scrape:up [options]

Options:
  --all           Upload all terms regardless of activeUntil date
  --terms <list>  Comma-separated list of specific terms to upload (e.g., 202610,202630)
  --help, -h      Show this help message

By default, only active terms (before their activeUntil date) are uploaded.
      `);
      process.exit(0);
    }
  }

  return options;
}

function filterTerms(config: Config, options: ReturnType<typeof parseArgs>) {
  const now = new Date();

  if (options.terms.length > 0) {
    const filteredTerms = config.terms.filter((t) =>
      options.terms.includes(t.term.toString()),
    );
    if (filteredTerms.length === 0) {
      console.log(
        `⚠️  No matching terms found for: ${options.terms.join(", ")}`,
      );
      process.exit(1);
    }
    return filteredTerms;
  }

  if (options.all) {
    return config.terms;
  }

  // Default: only active terms
  return config.terms.filter((t) => new Date(t.activeUntil) > now);
}

void (async () => {
  const options = parseArgs();

  const configStream = readFileSync(path.resolve(CACHE_PATH, "manifest.yaml"), {
    encoding: "utf8",
  });
  const config = parse(configStream) as Config;

  const termsToUpload = filterTerms(config, options);

  if (termsToUpload.length === 0) {
    console.log("ℹ️  No active terms to upload");
    return;
  }

  // Check that cache files exist
  const missingCaches = termsToUpload.filter(
    (term) =>
      !existsSync(path.resolve(CACHE_PATH, CACHE_FORMAT(term.term.toString()))),
  );

  if (missingCaches.length > 0) {
    console.log(
      `❌ Missing cache files for terms: ${missingCaches.map((t) => t.term).join(", ")}`,
    );
    console.log("   Run 'npm run scrape:gen' to generate cache files first");
    process.exit(1);
  }

  console.log(
    `📤 Uploading ${termsToUpload.length} term${termsToUpload.length > 1 ? "s" : ""}: ${termsToUpload.map((t) => t.term).join(", ")}`,
  );

  const projectDir = process.cwd();
  loadEnvConfig(projectDir);

  // HACK: saves from having two db connection strings
  let connectionString = process.env.DATABASE_URL!;
  if (connectionString.includes("neon.tech")) {
    connectionString = connectionString.replace("-pooler", "");
  }

  const db = drizzle({
    connection: connectionString,
    schema: schema,
  });

  console.log("🔌 Connected to database");

  // Insert config data once
  console.log("Inserting config data...");
  await insertConfigData(config, db);
  console.log("Config data inserted");

  // Process each term
  for (const termConfig of config.terms) {
    const cachePath = path.resolve(
      CACHE_PATH,
      CACHE_FORMAT(termConfig.term.toString()),
    );

    const cacheContent = readFileSync(cachePath, { encoding: "utf8" });
    const termData = JSON.parse(cacheContent) as TermScrape;

    console.log(`📦 Uploading term ${termConfig.term}...`);
    if (termData.timestamp) {
      console.log(
        `   Cache generated: ${new Date(termData.timestamp).toLocaleString()}`,
      );
    }

    await insertTermData(
      termData,
      db,
      new Date(termConfig?.activeUntil ?? "2000-01-01"),
    );
    console.log(`✅ Completed term ${termConfig.term}\n`);

    console.log(
      `🎉 Successfully uploaded ${termsToUpload.length} term${termsToUpload.length > 1 ? "s" : ""}`,
    );
  }

  console.log("\nAll terms processed successfully");
  process.exit(0);
})();
