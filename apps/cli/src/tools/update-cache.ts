/**
 * CLI tool: update-cache
 *
 * Performs a lightweight update on existing cache files by re-scraping
 * section data from Banner. Updates seat counts, waitlist info, meeting
 * times, campus, and other volatile section fields without a full re-scrape.
 *
 * Course-level data (descriptions, prereqs, etc.) and faculty are NOT
 * updated — use a full scrape (scrape:gen -f) for that.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { defineCommand } from "citty";
import { infer as zinfer } from "zod";
import { Config } from "@sneu/scraper/config";
import { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import { scrapeSections } from "@sneu/scraper/generate/sections";
import { parseMeetingTimes } from "@sneu/scraper/generate/marshall";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { brandIntro, p, pc, setVerbosity, isVerbose } from "../ui";
import { attachLogger } from "../logger";

const CACHE_FORMAT = (term: string) => `term-${term}.json`;

export default defineCommand({
  meta: {
    name: "update-cache",
    description:
      "lightweight update of cache files — re-scrapes section data (seats, meetings) without a full scrape",
  },
  args: {
    terms: {
      type: "string",
      default: "active",
      description:
        "comma-separated list of terms, 'active' (default), or 'all'",
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
    dryRun: {
      type: "boolean",
      description: "show what would change without writing files",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools update-cache");

    const emitter = new ScraperEventEmitter();
    attachLogger(emitter, {});

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

    const termsToUpdate = filterTerms(configResponse.data, args.terms);
    p.log.info(
      `Updating ${pc.bold(String(termsToUpdate.length))} cache${termsToUpdate.length !== 1 ? "s" : ""}`,
    );

    if (termsToUpdate.length === 0) {
      p.outro("No active terms to update");
      return;
    }

    for (const termConfig of termsToUpdate) {
      const termCode = termConfig.term.toString();
      const cachePath = path.resolve(args.cachePath, CACHE_FORMAT(termCode));

      if (!existsSync(cachePath)) {
        p.log.warning(`No cache file for term ${pc.cyan(termCode)}, skipping`);
        continue;
      }

      const cacheContent = readFileSync(cachePath, { encoding: "utf8" });
      const cacheResult = ScraperBannerCache.safeParse(
        JSON.parse(cacheContent),
      );
      if (!cacheResult.success) {
        p.log.error(pc.red(`Invalid cache for term ${termCode}`));
        continue;
      }

      const cache = cacheResult.data;
      p.log.step(`Updating term ${pc.cyan(termCode)}`);

      let scrapedSections;
      try {
        scrapedSections = await scrapeSections(termCode, emitter);
      } catch (e) {
        p.log.error(
          pc.red(`Failed to scrape sections for term ${termCode}: ${e}`),
        );
        throw e;
        continue;
      }

      if (!scrapedSections) {
        p.log.error(pc.red(`No sections returned for term ${termCode}`));
        continue;
      }

      // Index scraped sections by CRN for fast lookup
      const scrapedByCrn = new Map(
        scrapedSections.map((sec) => [sec.courseReferenceNumber, sec]),
      );

      let updated = 0;
      let missing = 0;

      // Update each section in the cache with fresh data
      for (const [courseKey, sections] of Object.entries(cache.sections)) {
        for (let i = 0; i < sections.length; i++) {
          const cached = sections[i];
          const fresh = scrapedByCrn.get(cached.crn);

          if (!fresh) {
            missing++;
            if (isVerbose()) {
              p.log.info(
                pc.dim(`Section ${cached.crn} (${courseKey}) not in scrape`),
              );
            }
            continue;
          }

          const newSeatCap = fresh.crossListCapacity ?? fresh.maximumEnrollment;
          const newSeatRem = fresh.crossListAvailable ?? fresh.seatsAvailable;
          const { meetingTimes } = parseMeetingTimes(fresh);

          const changed =
            cached.seatCapacity !== newSeatCap ||
            cached.seatRemaining !== newSeatRem ||
            cached.waitlistCapacity !== fresh.waitCapacity ||
            cached.waitlistRemaining !== fresh.waitAvailable;

          if (changed || isVerbose()) {
            updated++;
          }

          // Update volatile fields
          sections[i] = {
            ...cached,
            partOfTerm: fresh.partOfTerm,
            seatCapacity: newSeatCap,
            seatRemaining: newSeatRem,
            waitlistCapacity: fresh.waitCapacity,
            waitlistRemaining: fresh.waitAvailable,
            classType: fresh.scheduleTypeDescription,
            honors: fresh.sectionAttributes.some(
              (a) => a.description === "Honors",
            ),
            campus: fresh.campusDescription,
            meetingTimes,
          };
        }
      }

      // Update cache timestamp
      cache.timestamp = new Date().toISOString();

      if (args.dryRun) {
        p.log.info(
          `Term ${pc.cyan(termCode)}: ${pc.bold(String(updated))} seat changes, ${missing} missing ${pc.dim("(dry run)")}`,
        );
      } else {
        writeFileSync(cachePath, JSON.stringify(cache, null, 2));
        p.log.success(
          `Term ${pc.cyan(termCode)}: updated (${pc.bold(String(updated))} seat changes, ${missing} missing)`,
        );
      }
    }

    p.outro(
      args.dryRun
        ? "Dry run complete — no files written"
        : "Cache files updated",
    );
  },
});

function filterTerms(config: zinfer<typeof Config>, termArg: string) {
  if (termArg === "all") {
    return config.terms;
  }

  if (termArg === "active") {
    const now = new Date();
    return config.terms.filter((t) => {
      if (new Date(t.activeUntil) > now) return true;
      if (t.splitByPartOfTerm && t.parts) {
        return t.parts.some(
          (pt) => new Date(pt.activeUntil ?? t.activeUntil) > now,
        );
      }
      return false;
    });
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
