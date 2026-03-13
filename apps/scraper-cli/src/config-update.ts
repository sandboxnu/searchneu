/**
 * CLI command: scrape:config
 * Reads cache files, merges with existing config YAML, writes updated config.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { defineCommand, runMain } from "citty";
import { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import {
  StaticCampusesConfig,
  StaticBuildingsConfig,
  StaticSubjectsConfig,
  StaticNupathsConfig,
  StaticManifestConfig,
} from "@sneu/scraper/static-config";
import {
  mergeStaticCampuses,
  mergeStaticBuildings,
  mergeStaticSubjects,
  mergeStaticTerms,
} from "@sneu/scraper/config-update";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { consola } from "consola";
import { attachLogger } from "./logger";
import type * as z from "zod";

const HARDCODED_NUPATHS = [
  { code: "NCND", short: "ND", name: "Natural/Designed World" },
  { code: "NCEI", short: "EI", name: "Creative Express/Innov" },
  { code: "NCIC", short: "IC", name: "Interpreting Culture" },
  { code: "NCFQ", short: "FQ", name: "Formal/Quant Reasoning" },
  { code: "NCSI", short: "SI", name: "Societies/Institutions" },
  { code: "NCAD", short: "AD", name: "Analyzing/Using Data" },
  { code: "NCDD", short: "DD", name: "Difference/Diversity" },
  { code: "NCER", short: "ER", name: "Ethical Reasoning" },
  { code: "NCW1", short: "WF", name: "First Year Writing" },
  { code: "NCWI", short: "WI", name: "Writing Intensive" },
  { code: "NCW2", short: "WD", name: "Advanced Writing" },
  { code: "NCEX", short: "EX", name: "Integration Experience" },
  { code: "NCCE", short: "CE", name: "Capstone Experience" },
];

function loadYamlFile<T>(filePath: string, schema: z.ZodType<T>): T | null {
  if (!existsSync(filePath)) return null;
  const raw = parse(readFileSync(filePath, "utf8"));
  const result = schema.safeParse(raw);
  if (!result.success) {
    consola.warn(`failed to parse ${filePath}, treating as empty`);
    return null;
  }
  return result.data;
}

function loadCacheFiles(
  cachePath: string,
): z.infer<typeof ScraperBannerCache>[] {
  if (!existsSync(cachePath)) {
    consola.error(`cache path does not exist: ${cachePath}`);
    return [];
  }

  const files = readdirSync(cachePath).filter(
    (f) => f.startsWith("term-") && f.endsWith(".json"),
  );
  const caches: z.infer<typeof ScraperBannerCache>[] = [];

  for (const file of files) {
    const content = readFileSync(path.join(cachePath, file), "utf8");
    const result = ScraperBannerCache.safeParse(JSON.parse(content));
    if (result.success) {
      caches.push(result.data);
    } else {
      consola.warn(`skipping invalid cache file: ${file}`);
    }
  }

  return caches;
}

const main = defineCommand({
  meta: {
    name: "scrape:config",
    description:
      "generates/updates static config files from cache data",
  },
  args: {
    cachePath: {
      type: "string",
      default: "cache/",
      description: "path to cache directory",
      required: false,
    },
    configPath: {
      type: "string",
      default: "config/",
      description: "path to config directory",
      required: false,
    },
    seed: {
      type: "boolean",
      description:
        "first-time setup: creates all config files from scratch (also writes nupaths.yaml)",
      required: false,
    },
    dryRun: {
      type: "boolean",
      description: "show changes without writing",
      required: false,
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "",
      required: false,
    },
  },
  async run({ args }) {
    const emitter = new ScraperEventEmitter();
    attachLogger(emitter, { verbose: args.verbose });

    emitter.emit("config:start");

    const cachePath = path.resolve(args.cachePath);
    const configPath = path.resolve(args.configPath);

    // Load cache files
    const cacheFiles = loadCacheFiles(cachePath);
    emitter.emit("config:load-caches", { count: cacheFiles.length });

    if (cacheFiles.length === 0) {
      consola.warn("no cache files found, nothing to do");
      return;
    }

    // Ensure config directory exists
    if (!args.dryRun && !existsSync(configPath)) {
      mkdirSync(configPath, { recursive: true });
    }

    // --- Campuses ---
    const existingCampuses = args.seed
      ? []
      : (loadYamlFile(path.join(configPath, "campuses.yaml"), StaticCampusesConfig)?.campuses ?? []);
    const campusResult = mergeStaticCampuses(existingCampuses, cacheFiles);
    emitter.emit("config:merge:campuses", {
      added: campusResult.added.length,
      total: campusResult.merged.length,
    });

    // --- Buildings ---
    const existingBuildings = args.seed
      ? []
      : (loadYamlFile(path.join(configPath, "buildings.yaml"), StaticBuildingsConfig)?.buildings ?? []);
    const buildingResult = mergeStaticBuildings(existingBuildings, cacheFiles);
    emitter.emit("config:merge:buildings", {
      added: buildingResult.added.length,
      total: buildingResult.merged.length,
    });

    // --- Subjects ---
    const existingSubjects = args.seed
      ? []
      : (loadYamlFile(path.join(configPath, "subjects.yaml"), StaticSubjectsConfig)?.subjects ?? []);
    const subjectResult = mergeStaticSubjects(existingSubjects, cacheFiles);
    emitter.emit("config:merge:subjects", {
      added: subjectResult.added.length,
      total: subjectResult.merged.length,
    });

    // --- Terms (manifest) ---
    const existingManifest = args.seed
      ? []
      : (loadYamlFile(path.join(configPath, "manifest.yaml"), StaticManifestConfig)?.terms ?? []);
    const termResult = mergeStaticTerms(existingManifest, cacheFiles);
    emitter.emit("config:merge:terms", {
      added: termResult.added.length,
      total: termResult.merged.length,
    });

    // --- NUPaths (only written on --seed or if file doesn't exist) ---
    const nupathsPath = path.join(configPath, "nupaths.yaml");
    const writeNupaths = args.seed || !existsSync(nupathsPath);

    if (args.dryRun) {
      consola.info("[dry run] would write the following files:");
      consola.info(`  campuses.yaml: ${campusResult.merged.length} entries (+${campusResult.added.length})`);
      consola.info(`  buildings.yaml: ${buildingResult.merged.length} entries (+${buildingResult.added.length})`);
      consola.info(`  subjects.yaml: ${subjectResult.merged.length} entries (+${subjectResult.added.length})`);
      consola.info(`  manifest.yaml: ${termResult.merged.length} entries (+${termResult.added.length})`);
      if (writeNupaths) {
        consola.info(`  nupaths.yaml: ${HARDCODED_NUPATHS.length} entries`);
      }
      emitter.emit("config:done");
      return;
    }

    // Write files
    writeFileSync(
      path.join(configPath, "campuses.yaml"),
      stringify({ campuses: campusResult.merged }),
    );
    writeFileSync(
      path.join(configPath, "buildings.yaml"),
      stringify({ buildings: buildingResult.merged }),
    );
    writeFileSync(
      path.join(configPath, "subjects.yaml"),
      stringify({ subjects: subjectResult.merged }),
    );
    writeFileSync(
      path.join(configPath, "manifest.yaml"),
      stringify({ terms: termResult.merged }),
    );

    if (writeNupaths) {
      writeFileSync(nupathsPath, stringify({ nupaths: HARDCODED_NUPATHS }));
    }

    emitter.emit("config:done");
    consola.success("config files updated");
  },
});

void runMain(main);
