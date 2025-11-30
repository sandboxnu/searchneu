import * as z from "zod";
import { BannerTerm } from "./schemas/common";

export const TermConfig = z.strictObject({
  term: z.int(),
  name: z.string().optional(),
  activeUntil: z.string(),
});

export const AttributeConfig = z.strictObject({
  campus: z.array(
    z.strictObject({
      code: z.string(),
      name: z.string().optional(),
      group: z.string(),
    }),
  ),
  nupath: z.array(
    z.strictObject({
      code: z.string(),
      short: z.string(),
      name: z.string(),
    }),
  ),
});

export const Config = z.strictObject({
  terms: z.array(TermConfig),
  attributes: AttributeConfig,
});
