/**
 * Update term logic - scrapes sections and compares with database to find seat changes
 */

import { eq } from "drizzle-orm";
import type { createDbClient } from "@sneu/db/neon";
import { coursesT, sectionsT, subjectsT } from "@sneu/db/schema";
import { scrapeSections } from "../generate/steps/sections";
import { parseMeetingTimes } from "../generate/marshall";
import type { BannerSection } from "../schemas/banner/section";
import * as z from "zod";
import type { ScraperEventEmitter } from "../events";

export interface UpdateTermResult {
  sectionsWithNewSeats: z.infer<typeof BannerSection>[];
  sectionsWithUpdatedSeats: z.infer<typeof BannerSection>[];
  sectionsWithNewWaitlistSeats: z.infer<typeof BannerSection>[];
  sectionsWithUpdatedWaitlistSeats: z.infer<typeof BannerSection>[];
  sectionsWithUpdatedSeatCapacity: z.infer<typeof BannerSection>[];
  sectionsWithUpdatedWaitlistSeatCapacity: z.infer<typeof BannerSection>[];
  newSections: {
    crn: string;
    seatCapacity: number;
    seatRemaining: number;
    waitlistCapacity: number;
    waitlistRemaining: number;
    classType: string;
    honors: boolean;
    campus: string;
    meetingTimes: {
      building: string | null;
      room: string | null;
      days: number[];
      startTime: number;
      endTime: number;
      final: boolean;
    }[];
    faculty: string;
  }[];
  newSectionCourseKeys: number[];
}

/**
 * updateTerm scrapes the banner section information to determine
 * the sections with updated seat counts
 */
export async function updateTerm(
  term: string,
  db: ReturnType<typeof createDbClient>,
  emitter?: ScraperEventEmitter,
): Promise<UpdateTermResult> {
  emitter?.emit("update:start", { term });

  const scrapedSections = await scrapeSections(term);
  if (!scrapedSections) {
    throw new Error("Failed to scrape sections");
  }

  const staleSections = await db
    .select({
      crn: sectionsT.crn,
      seatRemaining: sectionsT.seatRemaining,
      waitRemaining: sectionsT.waitlistRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      courseId: coursesT.id,
      courseNumber: coursesT.courseNumber,
      courseSubject: subjectsT.code,
    })
    .from(sectionsT)
    .leftJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
    .leftJoin(subjectsT, eq(subjectsT.id, coursesT.subject))
    .where(eq(sectionsT.term, term));

  const sectionsWithNewSeats: z.infer<typeof BannerSection>[] = [];
  const sectionsWithUpdatedSeats: z.infer<typeof BannerSection>[] = [];
  const sectionsWithNewWaitlistSeats: z.infer<typeof BannerSection>[] = [];
  const sectionsWithUpdatedWaitlistSeats: z.infer<typeof BannerSection>[] = [];
  const sectionsWithUpdatedSeatCapacity: z.infer<typeof BannerSection>[] = [];
  const sectionsWithUpdatedWaitlistSeatCapacity: z.infer<
    typeof BannerSection
  >[] = [];

  const missingSections: string[] = [];
  for (const stale of staleSections) {
    const scrape = scrapedSections.find(
      (j) => j.courseReferenceNumber === stale.crn,
    );

    if (!scrape) {
      missingSections.push(stale.crn);
      continue;
    }

    if (scrape.seatsAvailable > 0 && stale.seatRemaining === 0) {
      sectionsWithNewSeats.push(scrape);
    }

    if (scrape.waitAvailable > 0 && stale.waitRemaining === 0) {
      sectionsWithNewWaitlistSeats.push(scrape);
    }

    if (scrape.seatsAvailable !== stale.seatRemaining) {
      sectionsWithUpdatedSeats.push(scrape);
    }

    if (scrape.waitAvailable !== stale.waitRemaining) {
      sectionsWithUpdatedWaitlistSeats.push(scrape);
    }

    if (scrape.waitCapacity !== stale.waitlistCapacity) {
      sectionsWithUpdatedWaitlistSeatCapacity.push(scrape);
    }

    if (scrape.maximumEnrollment !== stale.seatCapacity) {
      sectionsWithUpdatedSeatCapacity.push(scrape);
    }
  }

  let rawNewSections: z.infer<typeof BannerSection>[] = [];
  if (staleSections.length !== scrapedSections.length) {
    const keys = new Set(staleSections.map((s) => s.crn));

    rawNewSections = scrapedSections.filter(
      (s) => !keys.has(s.courseReferenceNumber),
    );
  }

  const rawCourseKeys = rawNewSections.map(
    (s) =>
      staleSections.find(
        (c) =>
          c.courseSubject === s.subject && c.courseNumber === s.courseNumber,
      )?.courseId ?? -1,
  );

  const rootedNewSections = rawNewSections.filter(
    (_, i) => rawCourseKeys[i] !== -1,
  );
  const newSectionCourseKeys = rawCourseKeys.filter((k) => k !== -1);

  const newSections = rootedNewSections.map((s) => {
    const mt = parseMeetingTimes(s);
    return {
      crn: s.courseReferenceNumber,
      seatCapacity: s.maximumEnrollment,
      seatRemaining: s.seatsAvailable,
      waitlistCapacity: s.waitCapacity,
      waitlistRemaining: s.waitAvailable,
      classType: s.scheduleTypeDescription,
      honors: s.sectionAttributes.some((a) => a.description === "Honors"),
      campus: s.campusDescription,
      meetingTimes: mt.meetingTimes,
      faculty: "TBA",
    };
  });

  if (missingSections.length > 0) {
    emitter?.emit("update:sections:missing", { crns: missingSections });
  }

  if (rootedNewSections.length !== rawNewSections.length) {
    const unrootedSections = rawNewSections.filter(
      (_, i) => rawCourseKeys[i] === -1,
    );
    emitter?.emit("update:sections:unrooted", {
      crns: unrootedSections.map((s) => s.courseReferenceNumber),
    });
  }

  emitter?.emit("update:seats:new", {
    crns: sectionsWithNewSeats.map((s) => s.courseReferenceNumber),
  });
  emitter?.emit("update:seats:waitlist", {
    crns: sectionsWithNewWaitlistSeats.map((s) => s.courseReferenceNumber),
  });
  emitter?.emit("update:sections:new", {
    crns: newSections.map((s) => s.crn),
  });

  emitter?.emit("update:complete", {
    term,
    sectionsWithNewSeats: sectionsWithNewSeats.length,
    sectionsWithNewWaitlistSeats: sectionsWithNewWaitlistSeats.length,
    newSections: newSections.length,
  });

  return {
    sectionsWithNewSeats,
    sectionsWithUpdatedSeats,
    sectionsWithNewWaitlistSeats,
    sectionsWithUpdatedWaitlistSeats,
    sectionsWithUpdatedWaitlistSeatCapacity,
    sectionsWithUpdatedSeatCapacity,
    newSections,
    newSectionCourseKeys,
  };
}
