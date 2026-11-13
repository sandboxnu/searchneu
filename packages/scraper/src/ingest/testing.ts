/** Fixture builders for the ingest tests. Not exported from the package. */

import type { z } from "zod";
import type { BannerSection } from "../schemas/banner/section";
import type { BannerSectionMeetingsFaculty } from "../schemas/banner/meetingsFaculty";
import type { SweepResult } from "./sweep";

type Section = z.infer<typeof BannerSection>;
type MeetingsFaculty = z.infer<typeof BannerSectionMeetingsFaculty>;

export const TEST_TERM = "202610";

let nextId = 1;

export function bannerSection(overrides: Partial<Section> = {}): Section {
  const crn = overrides.courseReferenceNumber ?? String(10000 + nextId++);
  const subject = overrides.subject ?? "CS";
  const courseNumber = overrides.courseNumber ?? "2500";
  // stays consistent when only one half is overridden
  const subjectCourse = overrides.subjectCourse ?? subject + courseNumber;

  return {
    id: nextId++,
    term: TEST_TERM,
    termDesc: "Spring 2026",
    courseReferenceNumber: crn,
    partOfTerm: "1",
    courseNumber,
    subject,
    subjectDescription: "Computer Science",
    sequenceNumber: "01",
    campusDescription: "Boston",
    scheduleTypeDescription: "Lecture",
    courseTitle: "Fundamentals of Computer Science 1",
    creditHours: null,
    maximumEnrollment: 100,
    enrollment: 90,
    seatsAvailable: 10,
    waitCapacity: 20,
    waitCount: 5,
    waitAvailable: 15,
    crossList: null,
    crossListCapacity: null,
    crossListCount: null,
    crossListAvailable: null,
    creditHourHigh: null,
    creditHourLow: 4,
    creditHourIndicator: null,
    openSection: true,
    linkIdentifier: null,
    isSectionLinked: false,
    faculty: [],
    meetingsFaculty: [],
    reservedSeatSummary: null,
    sectionAttributes: [],
    instructionalMethod: null,
    instructionalMethodDescription: null,
    ...overrides,
    subjectCourse,
  };
}

export function sectionAttribute(
  crn: string,
  code: string,
  description: string,
): Section["sectionAttributes"][number] {
  return {
    class: "sectionAttribute",
    code,
    courseReferenceNumber: crn,
    description,
    isZTCAttribute: false,
    termCode: TEST_TERM,
  };
}

export function meetingsFaculty(
  crn: string,
  overrides: Partial<MeetingsFaculty["meetingTime"]> = {},
): MeetingsFaculty {
  return {
    category: "01",
    class: "sectionResponse",
    courseReferenceNumber: crn,
    faculty: [],
    term: TEST_TERM,
    meetingTime: {
      beginTime: "0935",
      building: "SN",
      buildingDescription: "Snell Library",
      campus: "BOS",
      campusDescription: "Boston",
      category: "01",
      class: "sectionResponse",
      courseReferenceNumber: crn,
      creditHourSession: 4,
      endDate: "04/22/2026",
      endTime: "1115",
      friday: false,
      hoursWeek: 3.34,
      meetingScheduleType: "LEC",
      meetingType: "CLAS",
      meetingTypeDescription: "Class",
      monday: true,
      room: "108",
      saturday: false,
      startDate: "01/05/2026",
      sunday: false,
      term: TEST_TERM,
      thursday: true,
      tuesday: false,
      wednesday: true,
      ...overrides,
    },
  };
}

/** The envelope Banner wraps section search results in. */
export function searchResponse(
  sections: Section[],
  totalCount = sections.length,
) {
  return {
    success: true,
    totalCount,
    data: sections,
    pageOffset: 0,
    pageMaxSize: 500,
    sectionsFetchedCount: sections.length,
    pathMode: null,
    searchResultsConfigs: [],
    ztcEncodedImage: "",
  };
}

/** Sweeps shaped for the phases that run after assemble. */
export const snapshotOf = {
  ordinary: () => sweepOf([bannerSection({ courseReferenceNumber: "70001" })]),

  twoSections: () =>
    sweepOf([
      bannerSection({ courseReferenceNumber: "70001" }),
      bannerSection({ courseReferenceNumber: "70002", sequenceNumber: "02" }),
    ]),

  specialTopics: () =>
    sweepOf([
      bannerSection({
        courseReferenceNumber: "70001",
        courseNumber: "4950",
        courseTitle: "Special Topics in Compilers",
      }),
      bannerSection({
        courseReferenceNumber: "70002",
        courseNumber: "4950",
        courseTitle: "Special Topics in Robotics",
      }),
    ]),
};

export function sweepOf(sections: Section[]): SweepResult {
  return {
    term: TEST_TERM,
    termDefinition: { code: TEST_TERM, description: "Spring 2026" },
    sections,
    subjects: [{ code: "CS", description: "Computer Science" }],
    campuses: [{ code: "BOS", description: "Boston" }],
    reportedTotal: sections.length,
    pages: [{ offset: 0, received: sections.length }],
    duplicates: 0,
    startedAt: "2026-01-05T00:00:00.000Z",
    finishedAt: "2026-01-05T00:01:00.000Z",
  };
}
