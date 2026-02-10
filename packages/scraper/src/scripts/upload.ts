import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand, runMain } from "citty";
import { infer as zinfer } from "zod";
import { Config } from "../config";
import { consola } from "consola";
import { ScraperBannerCache } from "../schemas/scraper/banner-cache";
import { getDb } from "@sneu/db/pg";
import { uploadCatalogTerm } from "../upload/main";

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

    const db = getDb(process.env.DATABASE_URL!, true);

    const termsToUpload = filterTerms(config, args.terms);
    consola.info(`uploading ${termsToUpload.length} terms`);

    if (termsToUpload.length === 0) {
      consola.log("no active / configured terms to upload");
      return;
    }

    const missingCaches = termsToUpload.filter(
      (term) =>
        !existsSync(
          path.resolve(args.cachePath, CACHE_FORMAT(String(term.term))),
        ),
    );

    if (missingCaches.length > 0) {
      consola.error(
        "missing cache files for terms " +
          missingCaches.map((t) => t.term).join(", "),
      );
    }

    const presentCaches = termsToUpload.filter((term) =>
      existsSync(path.resolve(args.cachePath, CACHE_FORMAT(String(term.term)))),
    );

    for (const termConfig of presentCaches) {
      consola.start(`uploading term ${termConfig.term}`);

      const cachename = path.resolve(
        args.cachePath,
        CACHE_FORMAT(termConfig.term.toString()),
      );

      const cacheContent = readFileSync(cachename, { encoding: "utf8" });
      const safeTermData = ScraperBannerCache.safeParse(
        JSON.parse(cacheContent),
      );
      if (!safeTermData.success) {
        consola.error(safeTermData.error);
        return;
      }
      const termData = safeTermData.data;

      try {
        if (termData.version !== CACHE_VERSION) {
          throw Error(
            `invalid cache version (got ${termData.version}, expected ${CACHE_VERSION})`,
          );
        }

        await uploadCatalogTerm(termData, db, termConfig);
        consola.success(`uploaded term ${termConfig.term}`);
      } catch (e) {
        consola.error(`failed to upload term ${termConfig.term} - `, e);
        continue;
      }
    }

    consola.success(
      `successfully processed ${termsToUpload.length} term${termsToUpload.length > 1 ? "s" : ""}`,
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
