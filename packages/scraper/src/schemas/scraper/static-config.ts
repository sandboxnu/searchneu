/**
 * Zod schemas for the static config files (campuses, buildings, subjects, nupaths).
 * These define the shape of the YAML config that lives in version control.
 */

import * as z from "zod";

export const StaticCampus = z.strictObject({
  code: z.string(),
  name: z.string(),
  group: z.string(),
});

export const StaticCampusesConfig = z.strictObject({
  campuses: z.array(StaticCampus),
});

export const StaticBuilding = z.strictObject({
  code: z.string(),
  name: z.string(),
  campus: z.string(),
});

export const StaticBuildingsConfig = z.strictObject({
  buildings: z.array(StaticBuilding),
});

export const StaticSubject = z.strictObject({
  code: z.string(),
  description: z.string(),
});

export const StaticSubjectsConfig = z.strictObject({
  subjects: z.array(StaticSubject),
});

export const StaticNupath = z.strictObject({
  code: z.string(),
  short: z.string(),
  name: z.string(),
});

export const StaticNupathsConfig = z.strictObject({
  nupaths: z.array(StaticNupath),
});

export const StaticTermConfig = z.strictObject({
  term: z.int(),
  activeUntil: z.string(),
});

export const StaticManifestConfig = z.strictObject({
  terms: z.array(StaticTermConfig),
});

/** Aggregate of all static config for passing to upload */
export type StaticConfig = {
  campuses: z.infer<typeof StaticCampus>[];
  buildings: z.infer<typeof StaticBuilding>[];
  subjects: z.infer<typeof StaticSubject>[];
  nupaths: z.infer<typeof StaticNupath>[];
};
