/**
 * Shared helpers for CLI commands.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { ScraperBannerCache } from "@sneu/scraper/schemas/banner-cache";
import { p, pc } from "./ui";
import type * as z from "zod";

export function loadYamlFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
): T | null {
  if (!existsSync(filePath)) return null;
  const raw = parse(readFileSync(filePath, "utf8"));
  const result = schema.safeParse(raw);
  if (!result.success) {
    p.log.warning(`Failed to parse ${pc.dim(filePath)}, treating as empty`);
    return null;
  }
  return result.data;
}

export function loadCacheFiles(
  cachePath: string,
): z.infer<typeof ScraperBannerCache>[] {
  if (!existsSync(cachePath)) {
    p.log.error(pc.red(`Cache path does not exist: ${cachePath}`));
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
      p.log.warning(`Skipping invalid cache file: ${pc.dim(file)}`);
    }
  }

  return caches;
}
