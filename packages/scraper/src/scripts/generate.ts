import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand, runMain } from "citty";
import { scrapeCatalogTerm } from "../generate/main";
import { infer as zinfer } from "zod";
import { Config } from "../config";
import { consola } from "consola";
import { ScraperBannerCache } from "../schemas/scraper/banner-cache";

const CACHE_FORMAT = (term: string) => `term-${term}.json`;
const CACHE_VERSION = 3;

const main = defineCommand({
  meta: {
    name: "scrape:gen",
    description: "runs the scraper to generate the banner cache files",
  },
  args: {
    terms: {
      type: "string",
      default: "active",
      description:
        "comma-seperated list of specific terms to scrape, 'active' (default), or 'all'",
      required: false,
    },
    cachePath: {
      type: "string",
      default: "cache/",
      description: "",
      required: false,
    },
    interactive: {
      alias: "i",
      type: "boolean",
      description: "",
      required: false,
    },
    overwrite: {
      alias: "f",
      type: "boolean",
      description: "overwrites existing caches rather than skipping",
      required: false,
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "",
      required: false,
    },
    veryverbose: {
      alias: "vv",
      type: "boolean",
      description: "",
      required: false,
    },
  },
  async run({ args }) {
    if (args.verbose) consola.level = 4;
    if (args.veryverbose) consola.level = 999;

    const interactive = args.interactive;

    const configStream = readFileSync(
      path.resolve(args.cachePath, "manifest.yaml"),
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

    const termsToScrape = filterTerms(config, args.terms);
    consola.info(`scraping ${termsToScrape.length} terms`);

    if (termsToScrape.length === 0) {
      consola.log("no active / configured terms to scrape");
      return;
    }

    for (const termConfig of termsToScrape) {
      consola.start(`scraping term ${termConfig.term}`);

      const cachename = path.resolve(
        args.cachePath,
        CACHE_FORMAT(termConfig.term.toString()),
      );
      const existingCache = existsSync(cachename);
      if (args.overwrite && existingCache) {
        consola.info("existing cache found, overwriting with new scrape");
      } else if (!args.overwrite && existingCache) {
        consola.success("existing cache found, skipping term");
        continue;
      }

      try {
        const out = await scrapeCatalogTerm(
          termConfig.term.toString(),
          termConfig,
          interactive,
        );

        if (!out) {
          consola.error(`error scraping term ${termConfig.term}`);
          // return;
          continue;
        }

        const cachedData: zinfer<typeof ScraperBannerCache> = {
          version: CACHE_VERSION,
          timestamp: new Date().toISOString(),
          ...out,
        };

        writeFileSync(cachename, JSON.stringify(cachedData, null, 2));
        consola.success(`scraped term ${termConfig.term}`);
      } catch (e) {
        consola.error(`failed to scrape term ${termConfig.term}`, e);
        continue;
      }
    }

    consola.success(
      `successfully scraped ${termsToScrape.length} term${termsToScrape.length > 1 ? "s" : ""}`,
    );
  },
});

void runMain(main);

/**
 */
function filterTerms(config: zinfer<typeof Config>, termArg: string) {
  if (termArg === "all") {
    return config.terms;
  }

  if (termArg === "active") {
    const now = new Date();
    return config.terms.filter((t) => new Date(t.activeUntil) > now);
  }

  const splitTerms = termArg.split(",");
  const filteredTerms = config.terms.filter((t) =>
    splitTerms.includes(t.term.toString()),
  );
  if (filteredTerms.length === 0) {
    consola.error(`no matching terms found for: ${splitTerms.join(", ")}`);
    process.exit(1);
  }
  return filteredTerms;
}
