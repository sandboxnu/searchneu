import * as z from "zod";
import { courseNupathJoinT } from "@sneu/db/schema";
import type { ScraperBannerCache } from "../../schemas/scraper/banner-cache";
import { chunk, type Tx } from "../types";

export async function upsertNupathMappings(
  tx: Tx,
  scrape: z.infer<typeof ScraperBannerCache>,
  courseMap: Map<string, number>,
  nupathsMap: Map<string, number>,
  nupathCodes: Set<string>,
): Promise<void> {
  const mappings: { courseId: number; nupathId: number }[] = [];

  for (const c of scrape.courses) {
    for (const a of c.attributes) {
      if (!nupathCodes.has(a)) continue;

      const courseId = courseMap.get(c.subject + c.courseNumber);
      if (!courseId) {
        throw Error(`cannot find course id for ${c.subject}${c.courseNumber}`);
      }
      const nupathId = nupathsMap.get(a);
      if (!nupathId) {
        throw Error(`cannot find nupath ${a}`);
      }

      mappings.push({ courseId, nupathId });
    }
  }

  for (const batch of chunk(mappings, 5000)) {
    await tx
      .insert(courseNupathJoinT)
      .values(batch)
      .onConflictDoNothing({
        target: [courseNupathJoinT.courseId, courseNupathJoinT.nupathId],
      });
  }
}
