import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

// void (async () => {
//   const options = parseArgs();
//
//   const configStream = readFileSync(path.resolve(CACHE_PATH, "manifest.yaml"), {
//     encoding: "utf8",
//   });
//   const config = parse(configStream) as zinfer<typeof Config>;
//
//   const termsToUpload = filterTerms(config, options);
//
//   if (termsToUpload.length === 0) {
//     console.log("ℹ️  No active terms to upload");
//     return;
//   }
//
//   // Check that cache files exist
//   const missingCaches = termsToUpload.filter(
//     (term) =>
//       !existsSync(path.resolve(CACHE_PATH, CACHE_FORMAT(term.term.toString()))),
//   );
//
//   if (missingCaches.length > 0) {
//     console.log(
//       `❌ Missing cache files for terms: ${missingCaches.map((t) => t.term).join(", ")}`,
//     );
//     console.log("   Run 'npm run scrape:gen' to generate cache files first");
//     process.exit(1);
//   }
//
//   console.log(
//     `📤 Uploading ${termsToUpload.length} term${termsToUpload.length > 1 ? "s" : ""}: ${termsToUpload.map((t) => t.term).join(", ")}`,
//   );
//
//   console.log("🔌 Connected to database");
//
//   // Insert config data once
//   console.log("Inserting config data...");
//   await insertConfigData(config, db);
//   console.log("Config data inserted");
//
//   // Process each term
//   for (const termConfig of config.terms) {
//     const cachePath = path.resolve(
//       CACHE_PATH,
//       CACHE_FORMAT(termConfig.term.toString()),
//     );
//
//     const cacheContent = readFileSync(cachePath, { encoding: "utf8" });
//     const termData = JSON.parse(cacheContent) as TermScrape;
//
//     console.log(`📦 Uploading term ${termConfig.term}...`);
//     if (termData.timestamp) {
//       console.log(
//         `   Cache generated: ${new Date(termData.timestamp).toLocaleString()}`,
//       );
//     }
//
//     await insertTermData(
//       termData,
//       db,
//       config.attributes,
//       new Date(termConfig?.activeUntil ?? "2000-01-01"),
//     );
//     console.log(`✅ Completed term ${termConfig.term}\n`);
//
//     console.log(
//       `🎉 Successfully uploaded ${termsToUpload.length} term${termsToUpload.length > 1 ? "s" : ""}`,
//     );
//   }
//
//   console.log("\nAll terms processed successfully");
//   process.exit(0);
// })();
