import * as z from "zod";
import { BannerCRN, BannerTerm } from "./common";
import { BannerSectionMeetingsFaculty } from "./meetingsFaculty";

export const BannerSectionCourseAttributes = z.strictObject({
  class: z.string(),
  code: z.string(),
  courseReferenceNumber: BannerCRN,
  description: z.string(),
  isZTCAttribute: z.boolean(),
  termCode: BannerTerm,
});

export const BannerSection = z.strictObject({
  id: z.int(),
  term: BannerTerm,
  termDesc: z.string(),
  courseReferenceNumber: BannerCRN,
  partOfTerm: z.string(),
  courseNumber: z.string().length(4),
  subject: z.string(),
  subjectDescription: z.string(),
  sequenceNumber: z.string(),
  campusDescription: z.string(),
  scheduleTypeDescription: z.string(),
  courseTitle: z.string(),
  creditHours: z.null(),
  maximumEnrollment: z.int(),
  enrollment: z.int(),
  seatsAvailable: z.int(),
  waitCapacity: z.int(),
  waitCount: z.int(),
  waitAvailable: z.int(),
  crossList: z.string().nullable(),
  crossListCapacity: z.int().nullable(),
  crossListCount: z.int().nullable(),
  crossListAvailable: z.int().nullable(),
  creditHourHigh: z.null(),
  creditHourLow: z.int(),
  creditHourIndicator: z.null(),
  openSection: z.literal(true),
  linkIdentifier: z.null(),
  isSectionLinked: z.boolean(),
  subjectCourse: z.string(),
  faculty: z.array(z.null()).length(0),
  meetingsFaculty: z.array(BannerSectionMeetingsFaculty),
  reservedSeatSummary: z.null(),
  sectionAttributes: z.array(BannerSectionCourseAttributes),
  instructionalMethod: z.string(),
  instructionalMethodDescription: z.string(),
});

export const BannerSectionResponse = z.strictObject({
  success: z.boolean(),
  totalCount: z.int(),
  data: z.array(BannerSection),
});
