import { scrapeTerm } from "@/scraper/scrape";
import { TermScrape } from "@/scraper/types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand, runMain } from "citty";
import { scrapeCatalogTerm } from "@/scraper/gen/main";
import { infer as zinfer } from "zod";
import { Config } from "@/scraper/config";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;

interface CachedTermScrape extends TermScrape {
  timestamp: string;
}

const main = defineCommand({
  meta: {
    name: "scrape:gen",
    description: "runs the scraper to generate the banner cache files",
  },
  args: {
    cachePath: {
      type: "positional",
      description: "path of the cache files",
      required: false,
    },
    terms: {
      type: "string",
      description:
        "comma-seperated list of specific terms to scrape, 'active', or 'all'",
      required: false,
    },
  },
  async run({ args }) {
    const configStream = readFileSync(
      path.resolve(CACHE_PATH, "manifest.yaml"),
      {
        encoding: "utf8",
      },
    );
    const configRaw = parse(configStream);
    const configResponse = Config.safeParse(configRaw);
    if (!configResponse.success) {
      console.error(configResponse.error);
      return;
    }

    const config = configResponse.data;

    const termsToScrape = filterTerms(config, { terms: [], all: true });

    if (termsToScrape.length === 0) {
      console.log("ℹ️  No active terms to scrape");
      return;
    }

    for (const termConfig of termsToScrape) {
      const cachename = path.resolve(
        CACHE_PATH,
        CACHE_FORMAT(termConfig.term.toString()),
      );
      const existingCache = existsSync(cachename);

      const out = await scrapeCatalogTerm(
        termConfig.term.toString(),
        termConfig,
      );
      return;

      // const out = await scrapeTerm(term.term.toString());
      // const cachedData: CachedTermScrape = {
      //   ...out,
      //   timestamp: new Date().toISOString(),
      // };
      //
      // writeFileSync(cachename, JSON.stringify(cachedData, null, 2));
      // console.log(`✅ Completed term ${term.term}\n`);
    }

    console.log(
      `🎉 Successfully scraped ${termsToScrape.length} term${termsToScrape.length > 1 ? "s" : ""}`,
    );
  },
});

void runMain(main);

function filterTerms(
  config: zinfer<typeof Config>,
  options: { terms: string[]; all: boolean },
) {
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
