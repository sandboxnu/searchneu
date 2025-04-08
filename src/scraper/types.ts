export interface BannerSection {
  id: number;
  term: string;
  termDesc: string;
  courseReferenceNumber: string;
  partOfTerm: string;
  courseNumber: string;
  subject: string;
  subjectDescription: string;
  sequenceNumber: string;
  campusDescription: string;
  scheduleTypeDescription: string;
  courseTitle: string;
  creditHours: null;
  maximumEnrollment: number;
  enrollment: number;
  seatsAvailable: number;
  waitCapacity: number;
  waitCount: number;
  waitAvailable: number;
  crossList: string;
  crossListCapacity: number;
  crossListCount: number;
  crossListAvailable: number;
  creditHourHigh: null;
  creditHourLow: number;
  creditHourIndicator: null;
  openSection: boolean;
  linkIdentifier: null;
  isSectionLinked: boolean;
  subjectCourse: string;
  instructionalMethod: string;
  instructionalMethodDescription: string;
  reservedSeatSummary: null;

  meetingsFaculty: BannerSectionSession[];

  sectionAttributes: {
    class: string;
    code: string;
    courseReferenceNumber: string;
    description: string;
    isZTCAttribute: boolean;
    termCode: string;
  }[];

  // Hacking in the faculty field since it is scraped seperatly
  f?: string;
}

interface BannerSectionSession {
  category: string;
  class: string;
  courseReferenceNumber: string;
  faculty: null;
  meetingTime: {
    beginTime: string;
    building: string;
    buildingDescription: string;
    campus: string;
    campusDescription: string;
    category: string;
    class: string;
    courseReferenceNumber: string;
    creditHourSession: number;
    endDate: string;
    endTime: string;
    friday: boolean;
    hoursWeek: number;
    meetingScheduleType: string;
    meetingType: string;
    meetingTypeDescription: string;
    monday: boolean;
    room: string;
    saturday: boolean;
    startDate: string;
    sunday: boolean;
    term: string;
    thursday: boolean;
    tuesday: boolean;
    wednesday: boolean;
  };
  term: string;
}

export interface Section {
  crn: string;
  faculty: string;
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
}

export interface Course {
  name: string;
  term: string;
  subject: string;
  courseNumber: string;
  description: string;
  maxCredits: number;
  minCredits: number;
  sections: Section[];
  nupath: string[];
  // TODO: pre / co reqs
  // TODO: pre / co reqs for
}

export interface TermScrape {
  term: {
    code: string;
    description: string;
  };
  courses: Course[];
  subjects: string[];
}
