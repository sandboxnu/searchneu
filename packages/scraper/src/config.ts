import * as z from "zod";

export const PartOfTermConfig = z.strictObject({
  /** Banner partOfTerm code (e.g. "1", "A", "B") */
  code: z.string(),
  /** Display name for this part. Falls back to top-level name. */
  name: z.string().optional(),
  /** When this part expires. Falls back to top-level activeUntil. */
  activeUntil: z.string().optional(),
});

export const TermConfig = z.strictObject({
  term: z.int(),
  name: z.string().optional(),
  /** When true, sections are grouped by their Banner partOfTerm value and
   *  each group is uploaded as a separate term entry. When false (default),
   *  all sections are uploaded under a single term with partOfTerm "1". */
  splitByPartOfTerm: z.boolean().optional(),
  /** Per-part overrides for name and activeUntil when splitting. */
  parts: z.array(PartOfTermConfig).optional(),
  activeUntil: z.string(),
});

export const ManifestConfig = z.strictObject({
  terms: z.array(TermConfig),
});

/** @deprecated Use ManifestConfig instead */
export const Config = ManifestConfig;
