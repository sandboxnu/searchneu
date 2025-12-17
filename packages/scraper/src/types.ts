/**
 */

import z from "zod";
import {
  ScraperBannerCacheCourse,
  ScraperBannerCacheSection,
} from "./schemas/scraper/banner-cache";

/**
 */
// export interface Section {
//   crn: string;
//   /** section name. this will match the course name except for special topics */
//   name: string;
//   /** section description. note this will _only_ be filled when the section is a special topics course */
//   description: string;
//   sectionNumber: string;
//   faculty: Faculty[];
//   seatCapacity: number;
//   seatRemaining: number;
//   waitlistCapacity: number;
//   waitlistRemaining: number;
//   classType: string;
//   honors: boolean;
//   campus: string;
//   meetingTimes: {
//     building: string;
//     room: string;
//     days: number[];
//     startTime: number;
//     endTime: number;
//     final: boolean;
//     finalDate: string | null;
//   }[];
//   xlist: string[];
//   /** coreqs for the section. note this will _only_ be filled when the section is a special topic course */
//   coreqs: Requisite;
//   /** prereqs for the section. note this will _only_ be filled when the section is a special topic course */
//   prereqs: Requisite;
// }
//
export type Section = z.infer<typeof ScraperBannerCacheSection>;

export interface Faculty {
  bannerId: string;
  displayName: string;
  email?: string;
  primary: boolean;
}

// export interface Course {
//   subject: string;
//   courseNumber: string;
//   /** denotes if the course is a special topics course */
//   specialTopics: boolean;
//   name: string;
//   description: string;
//   maxCredits: number;
//   minCredits: number;
//   attributes: string[];
//   coreqs: Requisite;
//   prereqs: Requisite;
//   postreqs: Requisite;
// }
export type Course = z.infer<typeof ScraperBannerCacheCourse>;

export interface Condition {
  type: "and" | "or";
  items: RequisiteItem[];
}

export interface ReqsCourse {
  subject: string;
  courseNumber: string;
}

export interface Test {
  name: string;
  score: number;
}

export type RequisiteItem = Condition | ReqsCourse | Test;
export type Requisite = RequisiteItem | Record<string, never>;

export interface Subject {
  code: string;
  description: string;
}

export interface RoomSchedule {
  crn: string;
  startTime: number;
  endTime: number;
  days: number[];
}

export interface BuildingSchedule {
  [building: string]: {
    [room: string]: RoomSchedule[];
  };
}

export interface TermScrape {
  term: {
    code: string;
    description: string;
  };
  courses: Course[];
  sections: { [key: string]: Section[] };
  attributes: {
    code: string;
    name: string;
  }[];
  subjects: { code: string; description: string }[];
  rooms: BuildingSchedule;
  campuses: {
    code: string;
    name: string;
    buildings: {
      code: string;
      name: string;
    }[];
  }[];
  timestamp?: string;
}
