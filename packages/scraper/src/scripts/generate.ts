import { TermScrape } from "../types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand, runMain } from "citty";
import { scrapeCatalogTerm } from "../gen/main";
import { infer as zinfer } from "zod";
import { Config } from "../config";
import { consola } from "consola";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;
const CACHE_VERSION = 3;

interface CachedTermScrape extends TermScrape {
  timestamp: string;
  version: number;
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
    consola.level = 999;

    const configStream = readFileSync(
      path.resolve(CACHE_PATH, "manifest.yaml"),
      {
        encoding: "utf8",
      },
    );
    const configRaw = parse(configStream);
    const configResponse = Config.safeParse(configRaw);
    if (!configResponse.success) {
      consola.error(configResponse.error);
      return;
    }

    const config = configResponse.data;

    const termsToScrape = filterTerms(config, { terms: [], all: true });

    if (termsToScrape.length === 0) {
      consola.log("no active / configured terms to scrape");
      return;
    }

    for (const termConfig of termsToScrape) {
      if (termConfig.term !== 202630) continue;

      const cachename = path.resolve(
        CACHE_PATH,
        CACHE_FORMAT(termConfig.term.toString()),
      );
      const existingCache = existsSync(cachename);

      const out = await scrapeCatalogTerm(
        termConfig.term.toString(),
        termConfig,
      );

      if (!out) {
        return;
      }

      const cachedData: CachedTermScrape = {
        version: CACHE_VERSION,
        timestamp: new Date().toISOString(),
        ...out,
      };

      writeFileSync(cachename, JSON.stringify(cachedData, null, 2));
      consola.success(`scraped term ${termConfig.term}`);
    }

    consola.success(
      `🎉 successfully scraped ${termsToScrape.length} term${termsToScrape.length > 1 ? "s" : ""}`,
    );
  },
});

void runMain(main);

function filterTerms(
  config: zinfer<typeof Config>,
  options: { terms: string[]; all: boolean },
) {
  if (options.all) {
    return config.terms;
  }

  const now = new Date();

  if (options.terms.length > 0) {
    const filteredTerms = config.terms.filter((t) =>
      options.terms.includes(t.term.toString()),
    );
    if (filteredTerms.length === 0) {
      consola.log(`no matching terms found for: ${options.terms.join(", ")}`);
      process.exit(1);
    }
    return filteredTerms;
  }

  // default: only active terms
  return config.terms.filter((t) => new Date(t.activeUntil) > now);
}
