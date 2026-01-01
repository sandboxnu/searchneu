import * as z from "zod";
import { BannerCRN, BannerTerm } from "./common";
import { BannerSectionMeetingsFaculty } from "./meetingsFaculty";

export const BannerSectionCourseAttributes = z.strictObject({
  class: z.string(),
  code: z.string(),
  /** 5 digit crn referencing the section the attribute belongs to */
  courseReferenceNumber: BannerCRN,
  description: z.string(),
  isZTCAttribute: z.boolean(),
  /** term that the attribute's section belongs to */
  termCode: BannerTerm,
});

export const BannerSection = z.strictObject({
  /** the banner id */
  id: z.int(),
  /** term that the section belongs to */
  term: BannerTerm,
  /** long name of the term (ex `Spring 2026 (View Only)`) */
  termDesc: z.string(),
  /** 5 digit course reference number for the course. note these are unique per term, but not between terms */
  courseReferenceNumber: BannerCRN,
  partOfTerm: z.string(),
  /** 4 digit course number for the section */
  courseNumber: z.string().length(4),
  /** subject code (ex `CS`) for the section / course */
  subject: z.string(),
  /** long name (ex `Computer Science`) for the section / course */
  subjectDescription: z.string(),
  /** section number - note these are not necessarily assigned in numerical order */
  sequenceNumber: z.string(),
  /** long name (ex `Boston`) for the campus where the section takes place */
  campusDescription: z.string(),
  scheduleTypeDescription: z.string(),
  /** name of the section. for non-special topic courses, the name will be the same for all sections */
  courseTitle: z.string(),
  creditHours: z.number().nullable(),
  /** total number of seats available in this section */
  maximumEnrollment: z.int(),
  /** number of filled seats */
  enrollment: z.int(),
  /** seats available in this section */
  seatsAvailable: z.int(),
  /** total capacity of the waitlist - note this will be 0 for sections w/o a waitlist */
  waitCapacity: z.int(),
  /** number of waitlist seats filled */
  waitCount: z.int(),
  /** number of waitlist seats available - note this will never exceed the capacity */
  waitAvailable: z.int(),
  /** string identifier for the section crosslist (xlist) */
  crossList: z.string().nullable(),
  /** total capacity of the crosslist section - note this should be used instead of the section capacity when xlisted */
  crossListCapacity: z.int().nullable(),
  /** number of xlist seats filled - note this should be used instead of the section capacity when xlisted */
  crossListCount: z.int().nullable(),
  /** number of xlist seats available - note this should be used instead of the section capacity when xlisted */
  crossListAvailable: z.int().nullable(),
  creditHourHigh: z.number().nullable(),
  creditHourLow: z.number(),
  creditHourIndicator: z.string().nullable(),
  /** represents if there are seats that could be filled in the section */
  openSection: z.boolean(),
  /** always null; unknown usage */
  linkIdentifier: z.null(),
  /** always false; unknown usage */
  isSectionLinked: z.literal(false),
  /** combined subject + course number (internally called the `register`) ex `CS2500` */
  subjectCourse: z.string(),
  faculty: z.array(z.null()).length(0),
  meetingsFaculty: z.array(BannerSectionMeetingsFaculty),
  reservedSeatSummary: z.null(),
  sectionAttributes: z.array(BannerSectionCourseAttributes),
  instructionalMethod: z.string().nullable(),
  instructionalMethodDescription: z.string().nullable(),
});

export const BannerSectionResponse = z.strictObject({
  success: z.boolean(),
  /** total number of returned sections */
  totalCount: z.int(),
  data: z.array(BannerSection),
  pageOffset: z.int(),
  pageMaxSize: z.int(),
  sectionsFetchedCount: z.int(),
  pathMode: z.null(),
  searchResultsConfigs: z.array(
    z.strictObject({
      config: z.string(),
      display: z.string(),
      title: z.string(),
      required: z.boolean(),
      width: z.string(),
    }),
  ),
  ztcEncodedImage: z.string(),
});
