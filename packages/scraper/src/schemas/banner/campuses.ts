import * as z from "zod";

export const BannerCampuses = z.strictObject({
  code: z.string().length(3),
  description: z.string(),
});

export const BannerCampusesResponse = z.array(BannerCampuses);
