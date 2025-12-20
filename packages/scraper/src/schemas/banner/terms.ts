import * as z from "zod";
import { BannerTerm } from "./common";

export const BannerTerms = z.strictObject({
  code: BannerTerm,
  description: z.string(),
});

export const BannerTermsResponse = z.array(BannerTerms);
