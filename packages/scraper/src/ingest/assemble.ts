/**
 * Step 2 - a sweep into a TermSnapshot.
 *
 * Detail fields are left empty; a course scrape fills them in.
 */

import type { z } from "zod";
import { decode } from "html-entities";
import type { BannerSection } from "../schemas/banner/section";
import type {
  SnapshotCourse,
  SnapshotSection,
  TermSnapshot,
} from "../schemas/scraper/snapshot";
import { parseMeetingTimes } from "../generate/marshall";
import type { SweepResult } from "./sweep";

export function assemble(sweep: SweepResult): TermSnapshot {
  const crosslists = groupCrosslists(sweep.sections);

  const courses = new Map<string, SnapshotCourse>();
  const sections = new Map<string, SnapshotSection[]>();
  const attributes = new Map<string, string>();

  for (const banner of sweep.sections) {
    const register = banner.subjectCourse;

    if (!courses.has(register)) {
      courses.set(register, stubCourse(banner, attributes));
      sections.set(register, []);
    }

    const course = courses.get(register)!;

    // a later section's TOPC attribute can flip a course that looked ordinary
    if (!course.specialTopics && hasTopicsAttribute(banner)) {
      course.specialTopics = true;
      course.name = SPECIAL_TOPICS_PLACEHOLDER;
    }

    sections.get(register)!.push({
      crn: banner.courseReferenceNumber,
      name: banner.courseTitle,
      sectionNumber: banner.sequenceNumber,
      description: "",
      partOfTerm: banner.partOfTerm,
      // crosslisted sections share a seat pool with their siblings
      seatCapacity: banner.crossListCapacity ?? banner.maximumEnrollment,
      seatRemaining: banner.crossListAvailable ?? banner.seatsAvailable,
      waitlistCapacity: banner.waitCapacity,
      waitlistRemaining: banner.waitAvailable,
      classType: banner.scheduleTypeDescription,
      honors: banner.sectionAttributes.some((a) => a.description === "Honors"),
      campus: banner.campusDescription,
      meetingTimes: parseMeetingTimes(banner).meetingTimes,
      faculty: [],
      xlist: banner.crossList
        ? [...(crosslists.get(banner.crossList) ?? [])]
        : [],
      prereqs: {},
      coreqs: {},
    });
  }

  return {
    version: 6,
    timestamp: sweep.finishedAt,
    term: {
      code: sweep.termDefinition.code,
      description: sweep.termDefinition.description,
    },
    courses: [...courses.values()],
    sections: Object.fromEntries(sections),
    attributes: [...attributes].map(([code, name]) => ({ code, name })),
    subjects: sweep.subjects.map((subject) => ({
      code: subject.code,
      description: decode(subject.description),
    })),
    campuses: sweep.campuses.map((campus) => ({
      code: campus.code,
      description: campus.description,
    })),
  };
}

const SPECIAL_TOPICS_PLACEHOLDER = "Special Topics";

/**
 * A special topics course's real name comes from the catalog details
 * endpoint, so it gets a placeholder here.
 */
function stubCourse(
  banner: z.infer<typeof BannerSection>,
  attributes: Map<string, string>,
): SnapshotCourse {
  for (const attribute of banner.sectionAttributes) {
    attributes.set(attribute.code, attribute.description.trim());
  }

  const specialTopics =
    banner.courseTitle.includes(SPECIAL_TOPICS_PLACEHOLDER) ||
    hasTopicsAttribute(banner);

  return {
    subject: banner.subject,
    courseNumber: banner.courseNumber,
    specialTopics,
    name: specialTopics ? SPECIAL_TOPICS_PLACEHOLDER : banner.courseTitle,
    description: "",
    maxCredits: banner.creditHourHigh ?? banner.creditHourLow,
    minCredits: banner.creditHourLow,
    attributes: banner.sectionAttributes.map((a) => a.code),
    prereqs: {},
    coreqs: {},
    postreqs: {},
  };
}

function hasTopicsAttribute(banner: z.infer<typeof BannerSection>): boolean {
  return banner.sectionAttributes.some((a) => a.code === "TOPC");
}

function groupCrosslists(
  sections: z.infer<typeof BannerSection>[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const section of sections) {
    if (!section.crossList) continue;

    const group = groups.get(section.crossList);
    if (group) {
      group.push(section.courseReferenceNumber);
    } else {
      groups.set(section.crossList, [section.courseReferenceNumber]);
    }
  }

  return groups;
}
