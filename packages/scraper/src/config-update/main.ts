/**
 * Pure merge functions for static config generation.
 * No I/O — takes existing config + cache data, returns merged result.
 *
 * Merge rule: existing entries (by code) are NEVER overwritten.
 * Only new codes from cache are added.
 */

import type * as z from "zod";
import type { ScraperBannerCache } from "../schemas/scraper/banner-cache";
import type {
  StaticCampus,
  StaticBuilding,
  StaticSubject,
  StaticNupath,
  StaticTermConfig,
} from "../schemas/scraper/static-config";

type CacheFile = z.infer<typeof ScraperBannerCache>;

export type MergeResult<T> = {
  merged: T[];
  added: string[];
};

export function mergeStaticCampuses(
  existing: z.infer<typeof StaticCampus>[],
  cacheFiles: CacheFile[],
): MergeResult<z.infer<typeof StaticCampus>> {
  const existingCodes = new Set(existing.map((c) => c.code));
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    for (const campus of cache.campuses) {
      // Apply the same "?" fallback as upload does
      const code =
        campus.code === "?"
          ? campus.name.substring(0, 3).toUpperCase()
          : campus.code;

      if (!existingCodes.has(code)) {
        existingCodes.add(code);
        merged.push({
          code,
          name: campus.name,
          group: "",
        });
        added.push(code);
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
  const existingCodes = new Set(existing.map((b) => b.code));
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    for (const building of cache.buildings) {
      if (!existingCodes.has(building.code)) {
        existingCodes.add(building.code);
        merged.push({
          code: building.code,
          name: building.name,
          campus: building.campus,
        });
        added.push(building.code);
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
  const existingCodes = new Set(existing.map((s) => s.code));
  const merged = [...existing];
  const added: string[] = [];

  for (const cache of cacheFiles) {
    for (const subject of cache.subjects) {
      if (!existingCodes.has(subject.code)) {
        existingCodes.add(subject.code);
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
