import * as z from "zod";

export const BannerSubject = z.strictObject({
  /** subject code, e.g. "CS" */
  code: z.string(),
  /** HTML-encoded subject name, e.g. "Computer Science" */
  description: z.string(),
});

export const BannerSubjectsResponse = z.array(BannerSubject);
