import * as z from "zod";

export const BannerTerm = z.string().length(6);
export const BannerCRN = z.string().length(5);
