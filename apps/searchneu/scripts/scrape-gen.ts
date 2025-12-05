import { scrapeTerm } from "@/scraper/scrape";
import { Config, TermScrape } from "@/scraper/types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;

interface CachedTermScrape extends TermScrape {
  timestamp: string;
}

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
Usage: npm run scrape:gen [options]

Options:
  --all           Scrape all terms regardless of activeUntil date
  --terms <list>  Comma-separated list of specific terms to scrape (e.g., 202610,202630)
  --help, -h      Show this help message

By default, only active terms (before their activeUntil date) are scraped.
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

  const termsToScrape = filterTerms(config, options);

  if (termsToScrape.length === 0) {
    console.log("ℹ️  No active terms to scrape");
    return;
  }

  console.log(
    `🎯 Scraping ${termsToScrape.length} term${termsToScrape.length > 1 ? "s" : ""}: ${termsToScrape.map((t) => t.term).join(", ")}`,
  );

  for (const term of termsToScrape) {
    const cachename = path.resolve(
      CACHE_PATH,
      CACHE_FORMAT(term.term.toString()),
    );
    const existingCache = existsSync(cachename);

    if (existingCache) {
      console.log(`🔄 Regenerating cache for term ${term.term}`);
    } else {
      console.log(`🆕 Creating cache for term ${term.term}`);
    }

    const out = await scrapeTerm(term.term.toString());
    const cachedData: CachedTermScrape = {
      ...out,
      timestamp: new Date().toISOString(),
    };

    writeFileSync(cachename, JSON.stringify(cachedData, null, 2));
    console.log(`✅ Completed term ${term.term}\n`);
  }

  console.log(`🎉 Successfully scraped ${termsToScrape.length} term${termsToScrape.length > 1 ? "s" : ""}`);
})();
