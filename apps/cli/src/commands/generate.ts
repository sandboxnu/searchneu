import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand } from "citty";
import { scrapeCatalogTerm } from "@sneu/scraper/generate";
import { infer as zinfer } from "zod";
import { Config } from "@sneu/scraper/config";
import { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { brandIntro, p, pc, setVerbosity } from "../ui";
import { attachLogger } from "../logger";

const CACHE_FORMAT = (term: string) => `term-${term}.json`;
const CACHE_VERSION = 5;

export default defineCommand({
  meta: {
    name: "generate",
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
      default: process.env.SCRAPER_CACHE_PATH ?? "cache/",
      description: "path to cache directory (env: SCRAPER_CACHE_PATH)",
      required: false,
    },
    configPath: {
      type: "string",
      default: process.env.SCRAPER_CONFIG_PATH ?? "config/",
      description:
        "path to config directory containing manifest.yaml (env: SCRAPER_CONFIG_PATH)",
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
    // const interactive = args.interactive ?? false;
    // setVerbosity({ verbose: args.verbose, veryVerbose: args.veryverbose });
    setVerbosity({ verbose: true, veryVerbose: false });
    // updateSettings({ withGuide: false });
    brandIntro("generate");

    const emitter = new ScraperEventEmitter();
    attachLogger(emitter, { interactive: true });

    const configStream = readFileSync(
      path.resolve(args.configPath, "manifest.yaml"),
      { encoding: "utf8" },
    );
    const configRaw = parse(configStream);
    const configResponse = Config.safeParse(configRaw);
    if (!configResponse.success) {
      p.log.error(pc.red(String(configResponse.error)));
      p.cancel("Invalid config");
      return;
    }

    const config = configResponse.data;
    const termsToScrape = filterTerms(config, args.terms);

    p.log.info(
      `Scraping ${pc.bold(String(termsToScrape.length))} term${termsToScrape.length !== 1 ? "s" : ""}`,
    );

    if (termsToScrape.length === 0) {
      p.outro("No active terms to scrape");
      return;
    }

    for (const termConfig of termsToScrape) {
      const cachename = path.resolve(
        args.cachePath,
        CACHE_FORMAT(termConfig.term.toString()),
      );
      const existingCache = existsSync(cachename);
      if (args.overwrite && existingCache) {
        p.log.info(
          `Existing cache for ${pc.cyan(String(termConfig.term))}, overwriting`,
        );
      } else if (!args.overwrite && existingCache) {
        p.log.success(
          `Cache exists for ${pc.cyan(String(termConfig.term))}, skipping`,
        );
        continue;
      }

      try {
        const out = await scrapeCatalogTerm(
          termConfig.term.toString(),
          emitter,
        );

        if (!out) {
          p.log.error(pc.red(`Failed to scrape term ${termConfig.term}`));
          continue;
        }

        const cachedData: zinfer<typeof ScraperBannerCache> = {
          version: CACHE_VERSION,
          timestamp: new Date().toISOString(),
          ...out,
        };

        writeFileSync(cachename, JSON.stringify(cachedData, null, 2));
      } catch (e) {
        p.log.error(pc.red(`Failed to scrape term ${termConfig.term}: ${e}`));
        continue;
      }
    }

    p.outro(
      `Scraped ${pc.bold(String(termsToScrape.length))} term${termsToScrape.length > 1 ? "s" : ""} — cache is fresh`,
    );
  },
});

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
    p.log.error(
      pc.red(`No matching terms found for: ${splitTerms.join(", ")}`),
    );
    process.exit(1);
  }
  return filteredTerms;
}
