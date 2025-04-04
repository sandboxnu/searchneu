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

  meetingsFaculty: any[]; // TODO: types on this :(

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
  // TODO: meeting times
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
