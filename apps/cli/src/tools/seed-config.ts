/**
 * Subcommand: seed-config
 * Generates/updates static config files from cache data.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { defineCommand } from "citty";
import {
  StaticCampusesConfig,
  StaticBuildingsConfig,
  StaticSubjectsConfig,
  StaticManifestConfig,
} from "@sneu/scraper/static-config";
import { ScraperEventEmitter } from "@sneu/scraper/events";
import { brandIntro, p, pc, setVerbosity } from "../ui";
import { attachLogger } from "../logger";
import { loadYamlFile, loadCacheFiles } from "../helpers";
import {
  mergeStaticCampuses,
  mergeStaticBuildings,
  mergeStaticSubjects,
  mergeStaticTerms,
} from "../merge";

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

export default defineCommand({
  meta: {
    name: "seed-config",
    description: "generates/updates static config files from cache data",
  },
  args: {
    cachePath: {
      type: "string",
      default: process.env.SCRAPER_CACHE_PATH ?? "cache/",
      description: "path to cache directory (env: SCRAPER_CACHE_PATH)",
      required: false,
    },
    configPath: {
      type: "string",
      default: process.env.SCRAPER_CONFIG_PATH ?? "config/",
      description: "path to config directory (env: SCRAPER_CONFIG_PATH)",
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
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools seed-config");

    const emitter = new ScraperEventEmitter();
    attachLogger(emitter, {});

    emitter.emit("config:start");

    const cachePath = path.resolve(args.cachePath);
    const configPath = path.resolve(args.configPath);

    const cacheFiles = loadCacheFiles(cachePath);
    emitter.emit("config:load-caches", { count: cacheFiles.length });

    if (cacheFiles.length === 0) {
      p.outro("No cache files found — nothing to do");
      return;
    }

    if (!args.dryRun && !existsSync(configPath)) {
      mkdirSync(configPath, { recursive: true });
    }

    // --- Campuses ---
    const existingCampuses = args.seed
      ? []
      : (loadYamlFile(
          path.join(configPath, "campuses.yaml"),
          StaticCampusesConfig,
        )?.campuses ?? []);
    const campusResult = mergeStaticCampuses(existingCampuses, cacheFiles);
    emitter.emit("config:merge:campuses", {
      added: campusResult.added.length,
      total: campusResult.merged.length,
    });

    // --- Buildings ---
    const existingBuildings = args.seed
      ? []
      : (loadYamlFile(
          path.join(configPath, "buildings.yaml"),
          StaticBuildingsConfig,
        )?.buildings ?? []);
    const buildingResult = mergeStaticBuildings(existingBuildings, cacheFiles);
    emitter.emit("config:merge:buildings", {
      added: buildingResult.added.length,
      total: buildingResult.merged.length,
    });

    // --- Subjects ---
    const existingSubjects = args.seed
      ? []
      : (loadYamlFile(
          path.join(configPath, "subjects.yaml"),
          StaticSubjectsConfig,
        )?.subjects ?? []);
    const subjectResult = mergeStaticSubjects(existingSubjects, cacheFiles);
    emitter.emit("config:merge:subjects", {
      added: subjectResult.added.length,
      total: subjectResult.merged.length,
    });

    // --- Terms (manifest) ---
    const existingManifest = args.seed
      ? []
      : (loadYamlFile(
          path.join(configPath, "manifest.yaml"),
          StaticManifestConfig,
        )?.terms ?? []);
    const termResult = mergeStaticTerms(existingManifest, cacheFiles);
    emitter.emit("config:merge:terms", {
      added: termResult.added.length,
      total: termResult.merged.length,
    });

    // --- NUPaths ---
    const nupathsPath = path.join(configPath, "nupaths.yaml");
    const writeNupaths = args.seed || !existsSync(nupathsPath);

    if (args.dryRun) {
      p.note(
        [
          `campuses.yaml   ${pc.bold(String(campusResult.merged.length))} entries ${pc.green(`+${campusResult.added.length}`)}`,
          `buildings.yaml  ${pc.bold(String(buildingResult.merged.length))} entries ${pc.green(`+${buildingResult.added.length}`)}`,
          `subjects.yaml   ${pc.bold(String(subjectResult.merged.length))} entries ${pc.green(`+${subjectResult.added.length}`)}`,
          `manifest.yaml   ${pc.bold(String(termResult.merged.length))} entries ${pc.green(`+${termResult.added.length}`)}`,
          ...(writeNupaths
            ? [
                `nupaths.yaml    ${pc.bold(String(HARDCODED_NUPATHS.length))} entries`,
              ]
            : []),
        ].join("\n"),
        "Dry Run — would write",
      );
      emitter.emit("config:done");
      p.outro("Dry run complete — no files written");
      return;
    }

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
    p.outro("Config files updated");
  },
});
