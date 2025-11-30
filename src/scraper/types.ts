import { Requisite } from "./reqs";

export interface Section {
  crn: string;
  name: string;
  description: string;
  faculty: Faculty[];
  seatCapacity: number;
  seatRemaining: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
  classType: string;
  honors: boolean;
  campus: string;
  meetingTimes: {
    building: string;
    room: string;
    days: number[];
    startTime: number;
    endTime: number;
    final: boolean;
    finalDate: string | null;
  }[];
  xlist: string[];
}

export interface Faculty {
  bannerId: string;
  displayName: string;
  email?: string;
  primary: boolean;
}

export interface Course {
  term: string;
  subject: string;
  courseNumber: string;
  specialTopics: boolean;
  name: string;
  description: string;
  maxCredits: number;
  minCredits: number;
  nupath: string[];
  coreqs: Requisite;
  prereqs: Requisite;
  postreqs: Requisite;
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
  subjects: { code: string; description: string }[];
  rooms: BuildingSchedule;
  buildingCampuses: {
    [building: string]: string;
  };
  timestamp?: string;
}
