/**
 * Merge functions for static config files.
 * Moved from @sneu/scraper/config-update since this logic is CLI-only.
 */

import type * as z from "zod";
import type { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import type {
  StaticCampus,
  StaticBuilding,
  StaticSubject,
  StaticTermConfig,
} from "@sneu/scraper/static-config";

type CacheFile = z.infer<typeof ScraperBannerCache>;

export type MergeResult<T> = {
  merged: T[];
  added: string[];
};

/** Builds a set of all known codes (primary + aliases) from an entity list. */
function collectAllCodes(
  entries: { code: string; aliases?: string[] }[],
): Set<string> {
  const codes = new Set<string>();
  for (const entry of entries) {
    codes.add(entry.code);
    for (const alias of entry.aliases ?? []) {
      codes.add(alias);
    }
  }
  return codes;
}

/**
 * Builds a set of all known names/identifiers that an entity "claims".
 * Includes the entity name plus all aliases (since aliases act as both
 * code and name claims in the upload resolution maps).
 */
function collectAllNames(
  entries: { name: string; aliases?: string[] }[],
): Set<string> {
  const names = new Set<string>();
  for (const entry of entries) {
    names.add(entry.name);
    for (const alias of entry.aliases ?? []) {
      names.add(alias);
    }
  }
  return names;
}

export function mergeStaticCampuses(
  existing: z.infer<typeof StaticCampus>[],
  cacheFiles: CacheFile[],
): MergeResult<z.infer<typeof StaticCampus>> {
  const knownCodes = collectAllCodes(existing);
  const knownNames = collectAllNames(existing);
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    // add campuses from the "campus" part of the cache
    for (const campus of cache.campuses) {
      if (knownNames.has(campus.description)) continue;

      knownCodes.add(campus.code);
      knownNames.add(campus.description);
      merged.push({
        code: campus.code,
        name: campus.description,
        group: "",
      });
      added.push(campus.code);
    }

    // find the rest of the campuses from the sections
    for (const section of Object.values(cache.sections).flat()) {
      if (knownNames.has(section.campus)) continue;

      knownNames.add(section.campus);
      merged.push({
        code: "?",
        name: section.campus,
        group: "",
      });
      added.push("? - " + section.campus);

      for (const mt of section.meetingTimes) {
        if (!mt.campus || !mt.campusDescription) continue;
        if (knownNames.has(mt.campusDescription)) continue;

        knownNames.add(mt.campusDescription);
        knownCodes.add(mt.campus);
        merged.push({
          code: mt.campus,
          name: mt.campusDescription,
          group: "",
        });
        added.push(mt.campus);
      }
    }
  }

  merged.sort((a, b) => a.code.localeCompare(b.code));
  return { merged, added };
}

export function mergeStaticBuildings(
  existing: z.infer<typeof StaticBuilding>[],
  cacheFiles: CacheFile[],
): MergeResult<z.infer<typeof StaticBuilding>> {
  const knownCodes = collectAllCodes(existing);
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    for (const section of Object.values(cache.sections).flat()) {
      for (const mt of section.meetingTimes) {
        if (!mt.building || !mt.buildingDescription) continue;
        if (knownCodes.has(mt.building)) continue;

        knownCodes.add(mt.building);
        merged.push({
          code: mt.building,
          name: mt.buildingDescription,
          campus: mt.campus ?? "?",
        });
        added.push(mt.building);
      }
    }
  }

  merged.sort((a, b) => a.code.localeCompare(b.code));
  return { merged, added };
}

export function mergeStaticSubjects(
  existing: z.infer<typeof StaticSubject>[],
  cacheFiles: CacheFile[],
): MergeResult<z.infer<typeof StaticSubject>> {
  const knownCodes = collectAllCodes(existing);
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    for (const subject of cache.subjects) {
      if (!knownCodes.has(subject.code)) {
        knownCodes.add(subject.code);
        merged.push({
          code: subject.code,
          description: subject.description,
        });
        added.push(subject.code);
      }
    }
  }

  merged.sort((a, b) => a.code.localeCompare(b.code));
  return { merged, added };
}

export function mergeStaticTerms(
  existing: z.infer<typeof StaticTermConfig>[],
  cacheFiles: CacheFile[],
): MergeResult<z.infer<typeof StaticTermConfig>> {
  const existingTerms = new Set(existing.map((t) => t.term));
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    const termCode = parseInt(cache.term.code, 10);
    if (!existingTerms.has(termCode)) {
      existingTerms.add(termCode);
      merged.push({
        term: termCode,
        activeUntil: "TODO",
      });
      added.push(cache.term.code);
    }
  }

  merged.sort((a, b) => a.term - b.term);
  return { merged, added };
}
