import * as z from "zod";
import {
  ScraperBannerCache,
  ScraperBannerCacheCourse,
  ScraperBannerCacheSection,
} from "./banner-cache";

export const SnapshotCourse = ScraperBannerCacheCourse.omit({ crn: true });

export const SnapshotSection = ScraperBannerCacheSection;

export const TermSnapshot = z.strictObject({
  version: z.literal(6),
  timestamp: z.iso.datetime(),
  term: z.strictObject({
    code: z.string(),
    description: z.string(),
  }),
  courses: z.array(SnapshotCourse),
  /** keyed by register (subject + course number), e.g. "CS2500" */
  sections: z.record(z.string(), z.array(SnapshotSection)),
  attributes: z.array(
    z.strictObject({
      code: z.string(),
      name: z.string(),
    }),
  ),
  subjects: z.array(
    z.strictObject({
      code: z.string(),
      description: z.string(),
    }),
  ),
  campuses: z.array(
    z.strictObject({
      code: z.string(),
      description: z.string(),
    }),
  ),
});

export type TermSnapshot = z.infer<typeof TermSnapshot>;
export type SnapshotCourse = z.infer<typeof SnapshotCourse>;
export type SnapshotSection = z.infer<typeof SnapshotSection>;

/** Reads either version. */
export function parseSnapshot(raw: unknown): TermSnapshot {
  const v6 = TermSnapshot.safeParse(raw);
  if (v6.success) return v6.data;

  const v5 = ScraperBannerCache.safeParse(raw);
  if (!v5.success) {
    throw new Error(`unrecognised cache file: ${v5.error.message}`);
  }

  return {
    ...v5.data,
    version: 6,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    courses: v5.data.courses.map(({ crn, ...course }) => course),
  };
}

/** A snapshot is a v5 cache without the course `crn`, which is optional. */
export function toBannerCache(
  snapshot: TermSnapshot,
): z.infer<typeof ScraperBannerCache> {
  return { ...snapshot, version: 5 };
}
