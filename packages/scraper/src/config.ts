import * as z from "zod";

export const TermConfig = z.strictObject({
  term: z.int(),
  name: z.string().optional(),
  activeUntil: z.string(),
});

export const ManifestConfig = z.strictObject({
  terms: z.array(TermConfig),
});

/** @deprecated Use ManifestConfig instead */
export const Config = ManifestConfig;
