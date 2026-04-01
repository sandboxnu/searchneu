import * as z from "zod";
import { coursesT, subjectsT } from "@sneu/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ScraperBannerCache } from "../../schemas/scraper/banner-cache";
import { chunk, type Tx } from "../types";

export async function upsertCourses(
  tx: Tx,
  scrape: z.infer<typeof ScraperBannerCache>,
  subjectsMap: Map<string, number>,
  termId: number,
): Promise<Map<string, number>> {
  const values = scrape.courses.map((c) => {
    const subjectId = subjectsMap.get(c.subject);
    if (!subjectId) {
      throw Error(`subject ${c.subject} not found`);
    }
    return {
      termId,
      name: c.name,
      subject: subjectId,
      courseNumber: c.courseNumber,
      register: c.subject + c.courseNumber,
      description: c.description,
      minCredits: String(c.minCredits),
      maxCredits: String(c.maxCredits),
      prereqs: c.prereqs,
      coreqs: c.coreqs,
      postreqs: c.postreqs,
    };
  });

  for (const batch of chunk(values, 5000)) {
    await tx
      .insert(coursesT)
      .values(batch)
      .onConflictDoUpdate({
        target: [coursesT.termId, coursesT.subject, coursesT.courseNumber],
        set: {
          name: sql.raw(`excluded.${coursesT.name.name}`),
          description: sql.raw(`excluded."${coursesT.description.name}"`),
          minCredits: sql.raw(`excluded."${coursesT.minCredits.name}"`),
          maxCredits: sql.raw(`excluded."${coursesT.maxCredits.name}"`),
          prereqs: sql.raw(`excluded."${coursesT.prereqs.name}"`),
          coreqs: sql.raw(`excluded."${coursesT.coreqs.name}"`),
          postreqs: sql.raw(`excluded."${coursesT.postreqs.name}"`),
        },
      });
  }

  const courses = await tx
    .select({
      id: coursesT.id,
      subject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .where(eq(coursesT.termId, termId));

  const map = new Map<string, number>();
  for (const c of courses) {
    map.set(c.subject + c.courseNumber, c.id);
  }

  return map;
}
