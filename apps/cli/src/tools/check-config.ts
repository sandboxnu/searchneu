/**
 * Subcommand: check-config
 * Validates static config files for correctness.
 *
 * Checks:
 *   a) All campuses have a non-"?" code
 *   b) All buildings reference a valid campus
 *   c) All rooms (from cache files) have a building
 */

import path from "node:path";
import { defineCommand } from "citty";
import {
  StaticCampusesConfig,
  StaticBuildingsConfig,
} from "@sneu/scraper/static-config";
import { brandIntro, p, pc } from "../ui";
import { loadYamlFile, loadCacheFiles } from "../helpers";

type Issue = { check: string; message: string };

export default defineCommand({
  meta: {
    name: "check-config",
    description: "validates static config files for correctness",
  },
  args: {
    configPath: {
      type: "string",
      default: process.env.SCRAPER_CONFIG_PATH ?? "config/",
      description: "path to config directory (env: SCRAPER_CONFIG_PATH)",
      required: false,
    },
    cachePath: {
      type: "string",
      default: process.env.SCRAPER_CACHE_PATH,
      description:
        "path to cache directory (optional, enables room-building validation) (env: SCRAPER_CACHE_PATH)",
      required: false,
    },
  },
  async run({ args }) {
    brandIntro("tools check-config");

    const configPath = path.resolve(args.configPath);
    const issues: Issue[] = [];

    // Load config files
    const campusesData = loadYamlFile(
      path.join(configPath, "campuses.yaml"),
      StaticCampusesConfig,
    );
    const buildingsData = loadYamlFile(
      path.join(configPath, "buildings.yaml"),
      StaticBuildingsConfig,
    );

    if (!campusesData) {
      p.cancel("campuses.yaml not found or invalid");
      process.exit(1);
    }
    if (!buildingsData) {
      p.cancel("buildings.yaml not found or invalid");
      process.exit(1);
    }

    // (a) All campuses have a non-"?" code
    for (const campus of campusesData.campuses) {
      if (campus.code === "?") {
        issues.push({
          check: "campus-code",
          message: `campus "${campus.name}" has placeholder code "?"`,
        });
      }
    }

    // (b) All buildings reference a valid campus
    const validCampusCodes = new Set<string>();
    for (const campus of campusesData.campuses) {
      validCampusCodes.add(campus.code);
      for (const alias of campus.aliases ?? []) {
        validCampusCodes.add(alias);
      }
    }

    for (const building of buildingsData.buildings) {
      if (!building.campus || building.campus === "?") {
        issues.push({
          check: "building-campus",
          message: `building "${building.code}" (${building.name}) has no campus`,
        });
      } else if (!validCampusCodes.has(building.campus)) {
        issues.push({
          check: "building-campus",
          message: `building "${building.code}" (${building.name}) references unknown campus "${building.campus}"`,
        });
      }
    }

    // (c) All rooms have a building (requires cache files)
    if (args.cachePath) {
      const cacheFiles = loadCacheFiles(path.resolve(args.cachePath));

      for (const cache of cacheFiles) {
        for (const [key, sections] of Object.entries(cache.sections)) {
          for (const section of sections) {
            for (const mt of section.meetingTimes) {
              if (mt.room && !mt.building) {
                issues.push({
                  check: "room-building",
                  message: `term ${cache.term.code}, ${key} section ${section.crn}: room "${mt.room}" has no building`,
                });
              }
            }
          }
        }
      }
    }

    // Report results
    if (issues.length === 0) {
      p.outro("Config is valid — looking good");
      return;
    }

    p.log.warning(
      `Found ${pc.bold(String(issues.length))} issue${issues.length > 1 ? "s" : ""}:`,
    );
    for (const issue of issues) {
      p.log.message(`  ${pc.dim(`[${issue.check}]`)} ${issue.message}`);
    }
    p.cancel("Config validation failed");
    process.exit(1);
  },
});
