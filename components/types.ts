/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * ONLY PUT COMMONLY USED TYPES HERE
 */
import { Dayjs } from 'dayjs';
import { FilterOptions } from './ResultsPage/filters';

export type Requisite = string | CompositeReq | CourseReq;

export interface CompositeReq {
  type: 'and' | 'or';
  values: Requisite[];
}
export interface CourseReq {
  classId: string;
  subject: string;
  missing?: true;
}

export interface ReqFor {
  values: CourseReq[];
}

export type DayjsTuple = {
  start: Dayjs;
  end: Dayjs;
};

export type TimeToDayjs = {
  [key: number]: DayjsTuple[];
};

export enum PrereqType {
  PREREQ = 'prereq',
  COREQ = 'coreq',
  PREREQ_FOR = 'prereqFor',
  OPT_PREREQ_FOR = 'optPrereqFor',
}

export enum ReqKind {
  AND = 'and',
  OR = 'or',
}

export interface ReqType {
  type: ReqKind;
  values: Course[];
}

export interface RequisiteBranch {
  prereqs: ReqType;
  coreqs: ReqType;
}

export interface Course {
  sections: Section[];
  prereqs: CompositeReq;
  coreqs: CompositeReq;
  host: string;
  termId: string;
  desc: string;
  name: string;
  url: string;
  prettyUrl: string;
  classId: string;
  subject: string;
  lastUpdateTime: number;
  prereqsFor: ReqFor;
  optPrereqsFor: ReqFor;
  minCredits: number;
  maxCredits: number;
  feeDescription: string;
  feeAmount: number;
  nupath: any;
}

export interface Section {
  lastUpdateTime: number;
  meetings: Meeting[];
  profs: string[];
  waitCapacity: number;
  waitRemaining: number;
  online: boolean;
  seatsRemaining: number;
  seatsCapacity: number;
  honors: boolean;
  crn: string;
  campus: string;
  campusDescription: string;
  url: string;
}

export interface Meeting {
  location: string;
  startDate: Dayjs;
  endDate: Dayjs;
  times: DayjsTuple[];
  type: MeetingType;
}

export enum MeetingType {
  CLASS = 'Class',
  FINAL_EXAM = 'Final Exam',
}

// ======= Search Results ========
// Represents the course and employee data returned by /search
export interface SearchResult {
  results: SearchItem[];
  filterOptions: FilterOptions;
  hasNextPage: boolean;
}

export type CourseResult = {
  class: Course;
  sections: Section[];
  type: string;
};
export type Employee = any;
export type SearchItem = CourseResult | Employee;

export function BLANK_SEARCH_RESULT(): SearchResult {
  return {
    results: [],
    filterOptions: {
      nupath: [],
      subject: [],
      classType: [],
      campus: [],
    },
    hasNextPage: false,
  };
}

export function EMPTY_FILTER_OPTIONS(): FilterOptions {
  return {
    nupath: [],
    subject: [],
    classType: [],
    campus: [],
  };
}

export enum DayOfWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export enum Campus {
  NEU = 'NEU',
  CPS = 'CPS',
  LAW = 'LAW',
}

// ======= Notifications ========

export interface UserInfo {
  token: string;
  phoneNumber: string;
  courseIds: string[];
  sectionIds: string[];
}
