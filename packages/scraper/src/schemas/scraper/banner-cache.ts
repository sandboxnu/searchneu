/**
 * defines the schema for the Banner Catalog cache files
 */

import * as z from "zod";

export const ScraperBannerCacheRequisiteTest = z.strictObject({
  name: z.string(),
  score: z.number().nullable(),
});
export const ScraperBannerCacheRequisiteCourse = z.strictObject({
  subject: z.string(),
  courseNumber: z.string(),
});
export const ScraperBannerCacheRequisiteCondition = z.strictObject({
  type: z.enum(["and", "or"]),
  get items() {
    return z.array(ScraperBannerCacheRequisiteItem);
  },
});

export const ScraperBannerCacheRequisiteItem = z.union([
  ScraperBannerCacheRequisiteCourse,
  ScraperBannerCacheRequisiteCondition,
  ScraperBannerCacheRequisiteTest,
]);

export const ScraperBannerCacheRequisite = z.union([
  ScraperBannerCacheRequisiteItem,
  z.record(z.never(), z.never()),
]);

export const ScraperBannerFaculty = z.strictObject({
  displayName: z.string(),
  email: z.string().nullable(),
  primary: z.boolean(),
});

export const ScraperBannerMeetingTime = z.strictObject({
  building: z.string().nullable(),
  room: z.string().nullable(),
  days: z.array(z.int()).max(7),
  startTime: z.number(),
  endTime: z.number(),
  final: z.boolean(),
  finalDate: z.string().nullable(),
});

export const ScraperBannerCacheCourse = z.strictObject({
  id: z.number(),
  /** course subject code (ex `CS`) */
  subject: z.string(),
  /** course subject number (ex `2500`) */
  courseNumber: z.string().length(4),
  specialTopics: z.boolean(),
  name: z.string(),
  description: z.string(),
  maxCredits: z.number(),
  minCredits: z.number(),
  attributes: z.array(z.string()),
  coreqs: ScraperBannerCacheRequisite,
  prereqs: ScraperBannerCacheRequisite,
  postreqs: ScraperBannerCacheRequisite,

  // TODO: remove this lol
  crn: z.string().optional(),
});

export const ScraperBannerCacheSection = z.strictObject({
  crn: z.string().length(5),
  name: z.string(),
  description: z.string(),
  sectionNumber: z.string(),
  seatCapacity: z.number(),
  seatRemaining: z.number(),
  waitlistCapacity: z.number(),
  waitlistRemaining: z.number(),
  classType: z.string(),
  /** whether the section is an honors section */
  honors: z.boolean(),
  /** the campus where the section is offered */
  campus: z.string(),
  meetingTimes: z.array(ScraperBannerMeetingTime),
  faculty: z.array(ScraperBannerFaculty),
  xlist: z.array(z.string()),
  coreqs: ScraperBannerCacheRequisite,
  prereqs: ScraperBannerCacheRequisite,
});

export const ScraperBannerCache = z.strictObject({
  /** cache file version */
  version: z.literal(3),
  /** timestamp when the cache file has been generated */
  timestamp: z.iso.datetime(),
  term: z.strictObject({
    code: z.string(),
    description: z.string(),
  }),
  courses: z.array(ScraperBannerCacheCourse),
  sections: z.record(z.string(), z.array(ScraperBannerCacheSection)),
  attributes: z.array(
    z.strictObject({
      /** */
      code: z.string(),
      /** */
      name: z.string(),
    }),
  ),
  /** all subjects in the term */
  subjects: z.array(
    z.strictObject({
      /** id code for the subject (ex `CS`) */
      code: z.string(),
      /** full name for the subject (ex `Computer Science`) */
      description: z.string(),
    }),
  ),
  /** all campuses used in the term */
  campuses: z.array(
    z.strictObject({
      code: z.string(),
      /** full name for the campus (ex `Boston`) */
      name: z.string(),
    }),
  ),
  buildings: z.array(
    z.strictObject({
      code: z.string(),
      name: z.string(),
      campus: z.string(),
    }),
  ),
  rooms: z.array(
    z.strictObject({
      code: z.string(),
      building: z.string(),
      campus: z.string(),
    }),
  ),
});
