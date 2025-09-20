import { coursesT, sectionsT } from "@/db/schema";
import {
  getSectionFaculty,
  parseMeetingTimes,
  scrapeSections,
} from "@/scraper/scrape";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { BannerSection } from "@/scraper/types";
import logger from "@/lib/logger";

// updateTerm scrapes the banner section information to determine
// the sections with updated seat counts
export async function updateTerm(term: string) {
  logger.info({ term }, "updating term");
  const scrapedSections = await scrapeSections(term);

  const staleSections = await db
    .select({
      crn: sectionsT.crn,
      seatRemaining: sectionsT.seatRemaining,
      waitRemaining: sectionsT.waitlistRemaining,
      courseId: coursesT.id,
      courseNumber: coursesT.courseNumber,
      courseSubject: coursesT.subject,
    })
    .from(sectionsT)
    .leftJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
    .where(eq(coursesT.term, term));

  const sectionsWithNewSeats: BannerSection[] = [];
  const sectionsWithNewWaitlistSeats: BannerSection[] = [];

  // PERF: when notif info is added to db, if could be worth only
  // checking the sections people are subbed too

  const missingSections: string[] = [];
  for (const stale of staleSections) {
    const scrape = scrapedSections.find(
      (j) => j.courseReferenceNumber === stale.crn,
    );

    // PERF: what about sections that are no longer present?
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
  }

  let rawNewSections: BannerSection[] = [];
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

  let rootedNewSections = rawNewSections.filter(
    (_, i) => rawCourseKeys[i] !== -1,
  );
  const newSectionCourseKeys = rawCourseKeys.filter((k) => k !== -1);

  rootedNewSections = await getSectionFaculty(rootedNewSections);
  const newSections = rootedNewSections.map((s) => ({
    crn: s.courseReferenceNumber,
    seatCapacity: s.maximumEnrollment,
    seatRemaining: s.seatsAvailable,
    waitlistCapacity: s.waitCapacity,
    waitlistRemaining: s.waitAvailable,
    classType: s.scheduleTypeDescription,
    honors: s.sectionAttributes.some((a) => a.description === "Honors"),
    campus: s.campusDescription,
    meetingTimes: parseMeetingTimes(s),

    faculty: s.f ?? "TBA",
  }));

  if (missingSections) {
    logger.info("orphaned sections! " + missingSections);
  }

  if (rootedNewSections.length !== rawNewSections.length) {
    const unrootedSections = rawNewSections.filter(
      (_, i) => rawCourseKeys[i] === -1,
    );
    logger.info(
      "unrooted sections! " +
        unrootedSections.map((s) => s.courseReferenceNumber),
    );
  }

  logger.info(
    "Sections with open seats: " +
      sectionsWithNewSeats.map((s) => s.courseReferenceNumber),
  );
  logger.info(
    "Sections with open waitlist spots: " +
      sectionsWithNewWaitlistSeats.map((s) => s.courseReferenceNumber),
  );
  logger.info("New sections: " + newSections.map((s) => s.crn));

  return {
    sectionsWithNewSeats,
    sectionsWithNewWaitlistSeats,
    newSections,
    newSectionCourseKeys,
  };
}
