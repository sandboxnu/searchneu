import * as z from "zod";
import { BannerCRN, BannerTerm } from "./common";

export const BannerSectionMeetingsFaculty = z.strictObject({
  category: z.string(),
  class: z.string(),
  courseReferenceNumber: BannerCRN,
  faculty: z.array(
    z.strictObject({
      bannerId: z.string(),
      category: z.string(),
      class: z.string(),
      courseReferenceNumber: BannerCRN,
      displayName: z.string(),
      emailAddress: z.string().nullable(),
      primaryIndicator: z.boolean(),
      term: BannerTerm,
    }),
  ),
  meetingTime: z.strictObject({
    beginTime: z.string().nullable(),
    building: z.string().nullable(),
    buildingDescription: z.string().nullable(),
    campus: z.string().nullable(),
    campusDescription: z.string().nullable(),
    category: z.string(),
    class: z.string(),
    courseReferenceNumber: BannerCRN,
    creditHourSession: z.int().nullable(),
    endDate: z.string(),
    endTime: z.string().nullable(),
    friday: z.boolean(),
    hoursWeek: z.number(),
    meetingScheduleType: z.string(),
    meetingType: z.string(),
    meetingTypeDescription: z.string(),
    monday: z.boolean(),
    room: z.string().nullable(),
    saturday: z.boolean(),
    startDate: z.string(),
    sunday: z.boolean(),
    term: BannerTerm,
    thursday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
  }),
  term: BannerTerm,
});

export const BannerSectionMeetingsFacultyResponse = z.strictObject({
  fmt: z.array(BannerSectionMeetingsFaculty),
});
