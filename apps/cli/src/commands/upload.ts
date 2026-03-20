import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand } from "citty";
import { infer as zinfer } from "zod";
import { ManifestConfig } from "@sneu/scraper/config";
import { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import {
  StaticCampusesConfig,
  StaticBuildingsConfig,
  StaticSubjectsConfig,
  StaticNupathsConfig,
} from "@sneu/scraper/static-config";
import type { StaticConfig } from "@sneu/scraper/static-config";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { uploadCatalogTerm } from "@sneu/scraper/upload";
import { getDb } from "@sneu/db/pg";
import { sectionsT, termsT } from "@sneu/db/schema";
import { eq, max } from "drizzle-orm";
import { brandIntro, p, pc, setVerbosity } from "../ui";
import { attachLogger } from "../logger";

const CACHE_FORMAT = (term: string) => `term-${term}.json`;
const CACHE_VERSION = 5;

export default defineCommand({
  meta: {
    name: "upload",
    description: "uploads the banner cache files to the database",
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
        "path to config directory containing static config files (env: SCRAPER_CONFIG_PATH)",
      required: false,
    },
    force: {
      alias: "f",
      type: "boolean",
      description:
        "upload even if the cache is older than the latest DB update for the term",
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
    "dangerously-upload-production": {
      type: "boolean",
      description: "allow uploading cache files to production",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose, veryVerbose: args.veryverbose });

    brandIntro("upload");

    if (
      !(
        process.env.DATABASE_URL!.includes("localhost") ||
        process.env.DATABASE_URL!.includes("db.localtest.me")
      ) &&
      !args["dangerously-upload-production"]
    ) {
      p.log.error(
        pc.bgRed(pc.bold(pc.black(" WARNING "))) +
          " " +
          pc.red(
            "connected to production database! use --dangerously-upload-production to upload to production",
          ),
      );
      return;
    }

    const emitter = new ScraperEventEmitter();
    attachLogger(emitter, { interactive: args.interactive });

    const configStream = readFileSync(
      path.resolve(args.configPath, "manifest.yaml"),
      { encoding: "utf8" },
    );
    const configRaw = parse(configStream);
    const configResponse = ManifestConfig.safeParse(configRaw);
    if (!configResponse.success) {
      p.log.error(pc.red(String(configResponse.error)));
      p.cancel("Invalid config");
      return;
    }

    const config = configResponse.data;

    // Load static config files
    const configDir = path.resolve(args.configPath);
    const campusesPath = path.join(configDir, "campuses.yaml");
    const buildingsPath = path.join(configDir, "buildings.yaml");
    const subjectsPath = path.join(configDir, "subjects.yaml");
    const nupathsPath = path.join(configDir, "nupaths.yaml");

    if (
      !existsSync(campusesPath) ||
      !existsSync(buildingsPath) ||
      !existsSync(subjectsPath) ||
      !existsSync(nupathsPath)
    ) {
      p.cancel(
        "Missing static config files (campuses.yaml, buildings.yaml, subjects.yaml, nupaths.yaml)",
      );
      return;
    }

    const staticConfig: StaticConfig = {
      campuses: StaticCampusesConfig.parse(
        parse(readFileSync(campusesPath, "utf8")),
      ).campuses,
      buildings: StaticBuildingsConfig.parse(
        parse(readFileSync(buildingsPath, "utf8")),
      ).buildings,
      subjects: StaticSubjectsConfig.parse(
        parse(readFileSync(subjectsPath, "utf8")),
      ).subjects,
      nupaths: StaticNupathsConfig.parse(
        parse(readFileSync(nupathsPath, "utf8")),
      ).nupaths,
    };
    p.log.step("Static config loaded");

    const db = getDb(process.env.DATABASE_URL!, true);

    const termsToUpload = filterTerms(config, args.terms);
    p.log.info(
      `Uploading ${pc.bold(String(termsToUpload.length))} term${termsToUpload.length !== 1 ? "s" : ""}`,
    );

    if (termsToUpload.length === 0) {
      p.outro("No active terms to upload");
      return;
    }

    const missingCaches = termsToUpload.filter(
      (term) =>
        !existsSync(
          path.resolve(args.cachePath, CACHE_FORMAT(String(term.term))),
        ),
    );

    if (missingCaches.length > 0) {
      p.log.error(
        pc.red(
          "Missing cache files for terms: " +
            missingCaches.map((t) => t.term).join(", "),
        ),
      );
    }

    const presentCaches = termsToUpload.filter((term) =>
      existsSync(path.resolve(args.cachePath, CACHE_FORMAT(String(term.term)))),
    );

    for (const termConfig of presentCaches) {
      const cachename = path.resolve(
        args.cachePath,
        CACHE_FORMAT(termConfig.term.toString()),
      );

      const cacheContent = readFileSync(cachename, { encoding: "utf8" });
      const safeTermData = ScraperBannerCache.safeParse(
        JSON.parse(cacheContent),
      );
      if (!safeTermData.success) {
        p.log.error(pc.red(String(safeTermData.error)));
        return;
      }
      const termData = safeTermData.data;

      try {
        if (termData.version !== CACHE_VERSION) {
          throw Error(
            `Invalid cache version (got ${termData.version}, expected ${CACHE_VERSION})`,
          );
        }

        // Freshness check
        if (!args.force) {
          const [row] = await db
            .select({ latestUpdate: max(sectionsT.updatedAt) })
            .from(sectionsT)
            .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
            .where(eq(termsT.term, termData.term.code));

          if (row?.latestUpdate) {
            const cacheTime = new Date(termData.timestamp);
            if (cacheTime < row.latestUpdate) {
              p.log.warning(
                `Cache for term ${pc.cyan(String(termConfig.term))} is stale ` +
                  pc.dim(
                    `(cache: ${cacheTime.toISOString()}, db: ${row.latestUpdate.toISOString()})`,
                  ) +
                  ` — use ${pc.bold("--force")} to override`,
              );
              continue;
            }
          }
        }

        if (termConfig.splitByPartOfTerm) {
          const parts = getDistinctPartsOfTerm(termData);
          p.log.info(
            `Splitting term ${pc.cyan(String(termConfig.term))} into ${pc.bold(String(parts.length))} parts: ${parts.join(", ")}`,
          );
          for (const part of parts) {
            await uploadCatalogTerm(
              termData,
              db,
              termConfig,
              staticConfig,
              part,
              emitter,
            );
          }
        } else {
          await uploadCatalogTerm(
            termData,
            db,
            termConfig,
            staticConfig,
            undefined,
            emitter,
          );
        }
      } catch (e) {
        p.log.error(pc.red(`Failed to upload term ${termConfig.term}: ${e}`));
        continue;
      }
    }

    p.outro(
      `Processed ${pc.bold(String(termsToUpload.length))} term${termsToUpload.length > 1 ? "s" : ""} — database is up to date`,
    );
  },
});

function filterTerms(config: zinfer<typeof ManifestConfig>, termArg: string) {
  if (termArg === "all") {
    return config.terms;
  }

  if (termArg === "active") {
    const now = new Date();
    return config.terms.filter((t) => isTermActive(t, now));
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

function isTermActive(
  t: zinfer<typeof ManifestConfig>["terms"][number],
  now: Date,
) {
  if (new Date(t.activeUntil) > now) return true;
  if (t.splitByPartOfTerm && t.parts) {
    return t.parts.some(
      (pt) => new Date(pt.activeUntil ?? t.activeUntil) > now,
    );
  }
  return false;
}

function getDistinctPartsOfTerm(
  termData: zinfer<typeof ScraperBannerCache>,
): string[] {
  const parts = new Set<string>();
  for (const sections of Object.values(termData.sections)) {
    for (const section of sections) {
      parts.add(section.partOfTerm);
    }
  }
  return [...parts].sort();
}
