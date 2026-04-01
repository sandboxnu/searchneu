import * as z from "zod";
import { sectionsT } from "@sneu/db/schema";
import { eq, sql } from "drizzle-orm";
import type {
  ScraperBannerCache,
  ScraperBannerMeetingTime,
} from "../../schemas/scraper/banner-cache";
import { chunk, type Tx } from "../types";

export type SectionResult = {
  sectionsMap: Map<string, number>;
  meetingTimes: Map<string, z.infer<typeof ScraperBannerMeetingTime>[]>;
  removedSectionIds: number[];
};

export async function upsertSections(
  tx: Tx,
  scrape: z.infer<typeof ScraperBannerCache>,
  courseMap: Map<string, number>,
  campusNameMap: Map<string, number>,
  termId: number,
): Promise<SectionResult> {
  const meetingTimes = new Map<
    string,
    z.infer<typeof ScraperBannerMeetingTime>[]
  >();

  const values = Object.entries(scrape.sections).flatMap(
    ([courseRegister, sections]) =>
      sections.map((s) => {
        if (meetingTimes.has(s.crn)) {
          throw Error(`crn ${s.crn} is already used`);
        }
        meetingTimes.set(s.crn, s.meetingTimes);

        const courseId = courseMap.get(courseRegister);
        if (!courseId) {
          throw Error(`course ${courseRegister} not found`);
        }

        const campusId = campusNameMap.get(s.campus);
        if (!campusId) {
          throw Error(`campus ${s.campus} not found`);
        }

        const primaryFaculty = s.faculty.find((f) => f.primary);

        return {
          termId,
          courseId,
          crn: s.crn,
          faculty: primaryFaculty?.displayName ?? "NA",
          seatCapacity: s.seatCapacity,
          seatRemaining: s.seatRemaining,
          waitlistCapacity: s.waitlistCapacity,
          waitlistRemaining: s.waitlistRemaining,
          classType: s.classType,
          honors: s.honors,
          campus: campusId,
        };
      }),
  );

  for (const batch of chunk(values, 5000)) {
    await tx
      .insert(sectionsT)
      .values(batch)
      .onConflictDoUpdate({
        target: [sectionsT.termId, sectionsT.crn],
        set: {
          faculty: sql.raw(`excluded."${sectionsT.faculty.name}"`),
          seatCapacity: sql.raw(`excluded."${sectionsT.seatCapacity.name}"`),
          seatRemaining: sql.raw(`excluded."${sectionsT.seatRemaining.name}"`),
          waitlistCapacity: sql.raw(
            `excluded."${sectionsT.waitlistCapacity.name}"`,
          ),
          waitlistRemaining: sql.raw(
            `excluded."${sectionsT.waitlistRemaining.name}"`,
          ),
          classType: sql.raw(`excluded."${sectionsT.classType.name}"`),
          honors: sql.raw(`excluded.${sectionsT.honors.name}`),
          campus: sql.raw(`excluded.${sectionsT.campus.name}`),
        },
      });
  }

  const sections = await tx
    .select({ id: sectionsT.id, crn: sectionsT.crn })
    .from(sectionsT)
    .where(eq(sectionsT.termId, termId));

  const sectionsMap = new Map<string, number>();
  for (const s of sections) {
    sectionsMap.set(s.crn, s.id);
  }

  const scrapedCrns = new Set(values.map((s) => s.crn));
  const removedSectionIds = sections
    .filter((s) => !scrapedCrns.has(s.crn))
    .map((s) => s.id);

  return { sectionsMap, meetingTimes, removedSectionIds };
}
