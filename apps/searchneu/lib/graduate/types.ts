import { Requisite } from "@sneu/scraper/types";

/**
 * Describes the term SearchNEU uses for each of Northeastern's NUPath academic
 * breadth requirements.
 */
export enum NUPathEnum {
  ND = "Natural/Designed World",
  EI = "Creative Express/Innov",
  IC = "Interpreting Culture",
  FQ = "Formal/Quant Reasoning",
  SI = "Societies/Institutions",
  AD = "Analyzing/Using Data",
  DD = "Difference/Diversity",
  ER = "Ethical Reasoning",
  WF = "1st Yr Writing",
  WD = "Adv Writ Dscpl",
  WI = "Writing Intensive",
  EX = "Integration Experience",
  CE = "Capstone Experience",
}

/**
 * Represents one of the seasons in which a student can take a course, as
 * abbreviated by Northeastern.
 */
export enum SeasonEnum {
  FL = "FL",
  SP = "SP",
  S1 = "S1",
  S2 = "S2",
  SM = "SM",
}

/** A Status is one of on CO-OP, CLASSES, or INACTIVE */
export enum StatusEnum {
  COOP = "COOP",
  CLASSES = "CLASSES",
  INACTIVE = "INACTIVE",
  HOVERINACTIVE = "HOVERINACTIVE",
  HOVERCOOP = "HOVERCOOP",
}

/**
 * A Audit course.
 *
 * @param classId The course number of the audit course.
 * @param subject The subject of the audit course.
 */
export interface IAuditCourse {
  classId: number;
  subject: string;
}

/**
 * A course within a audit used by of the App. A generic id field is used for
 * book keeping purposes by the drag and drop library, in cases where we don't
 * care about this id, T can null.
 *
 * @param name          The name of the course
 * @param classId       The classId of this course (1210, 1800, etc)
 * @param subject       The subject of this course (CS, DS, etc)
 * @param prereqs       The prerequisites for this course
 * @param coreqs        The corequisites for this course
 * @param nupaths       The nupaths this course fulfills
 * @param numCreditsMin The minimum number of credits this course gives
 * @param numCreditsMax The maximum number of credits this course gives
 * @param id            Unique id used as a book keeping field for dnd.
 */
export interface AuditCourse<T> {
  name: string;
  classId: string;
  subject: string;
  prereqs?: Requisite;
  coreqs?: Requisite;
  nupaths?: NUPathEnum[];
  numCreditsMin: number;
  numCreditsMax: number;
  id: T;
  generic?: boolean;
}

/**
 * A clean version of the AuditTerm used by of the App. A generic id field is
 * used for book keeping purposes by the drag and drop library, in cases where
 * we don't care about this id, T can null.
 *
 * @param year    The year of this term
 * @param season  The season of this term
 * @param status  The status of this term, on coop, classes, or inactive.
 * @param classes A list of the classes of this term.
 * @param id      Unique id used as a book keeping field for dnd.
 */
export interface AuditTerm<T> {
  season: SeasonEnum;
  status: StatusEnum;
  classes: AuditCourse<T>[];
  id: T;
}

/**
 * A AuditYear, representing a year of a audit
 *
 * @param year         The academic year number(1, 2, 3...) not to be confused
 *   with the calendar year. One academic year spans from [Calendar Year X,
 *   Fall] - [Calendar Year X + 1, Summer 2].
 *
 *   Storing the academic year num isn't necessary but can be nice since it
 *   prevents us from relying on the order in which AuditYears are stored in
 *   an Audit.
 * @param fall         The fall term
 * @param spring       The spring term
 * @param summer1      The summer 1 term
 * @param summer2      The summer 2 term
 * @param isSummerFull True if the summer1 should hold the classes for summer full.
 */
export interface AuditYear<T> {
  year: number;
  fall: AuditTerm<T>;
  spring: AuditTerm<T>;
  summer1: AuditTerm<T>;
  summer2: AuditTerm<T>;
  isSummerFull: boolean;
}

/**
 * A clean version of a student's audit as used in of the App with no
 * redundunt year information.
 *
 * @param years A list of the years of this object
 */
export interface Audit<T> {
  years: AuditYear<T>[];
}

export interface ParsedCourse {
  subject: string;
  classId: string;
}

export type INEUReqError =
  | INEUReqCourseError
  | INEUReqAndError
  | INEUReqOrError;

export enum ReqErrorType {
  COURSE = "course",
  AND = "and",
  OR = "or",
}

export interface INEUReqCourseError {
  type: ReqErrorType.COURSE;
  subject: string;
  classId: string;
}

export interface INEUReqAndError {
  type: ReqErrorType.AND;
  missing: INEUReqError[];
  subject?: string;
  classId?: string;
}

export interface INEUReqOrError {
  type: ReqErrorType.OR;
  missing: INEUReqError[];
  subject?: string;
  classId?: string;
}

export interface TermError {
  [key: string]: INEUReqError | undefined;
}

export interface AuditWarnings {
  type: string;
  years: YearError[];
}

export interface YearError {
  year: number;
  fall: TermError;
  spring: TermError;
  summer1: TermError;
  summer2: TermError;
}

export type PreReqWarnings = AuditWarnings & {
  type: "prereq";
};

export type CoReqWarnings = AuditWarnings & {
  type: "coreq";
};

//                                       NEW MAJOR OBJECT HERE
/**
 * A Major, containing all the requirements.
 *
 * @param name                 The name of the major.
 * @param requirementSections  A list of the sections of requirements.
 * @param totalCreditsRequired Total credits required to graduate with this major.
 * @param yearVersion          The catalog version year of this major.
 * @param concentrations       The possible concentrations within this major.
 */
export interface Major {
  name: string;
  requirementSections: Section[];
  totalCreditsRequired: number;
  yearVersion: number;
  concentrations?: Concentrations;
  metadata?: MajorMetadata;
}

/**
 * Metadata for a major.
 *
 * @param verified   Whether the major has been manually verified.
 * @param lastEdited The last time the major was edited MM/DD/YYYY.
 * @param branch     The branch of the scraper (must be main).
 */
export interface MajorMetadata {
  verified: boolean;
  lastEdited: string;
  branch: string;
}

/**
 * A Minor, containing all the requirements.
 *
 * @param name                 The name of the minor.
 * @param requirementSections  A list of the sections of requirements.
 * @param totalCreditsRequired Total credits required to graduate with this minor.
 * @param yearVersion          The catalog version year of this minor.
 * @param metadata             Metadata for the minor.
 */

export interface Minor {
  name: string;
  requirementSections: Section[];
  totalCreditsRequired: number;
  yearVersion: number;
  metadata?: MinorMetaData;
}

/**
 * Metadata for a minor.
 *
 * @param verified   Whether the major has been manually verified.
 * @param lastEdited The last time the major was edited MM/DD/YYYY.
 * @param branch     The branch of the scraper (must be main).
 */
export interface MinorMetaData {
  verified: boolean;
  lastEdited: string;
  branch: string;
}

/**
  * A Concentrations, contains all of the available concentrations for the major
  * and their respective requirements.
  
  * @param minOptions           The minimum number of concentrations required for
  *   the major.
  * @param concentrationOptions The list of sections representing all of the
  *   available concentrations in the major.
  */
export interface Concentrations {
  minOptions: number;
  concentrationOptions: Section[];
}

/**
 * A Section, containing its related requirements.
 *
 * @param title               The title of the section.
 * @param requirements        A list of the requirements within this section.
 * @param minRequirementCount The minimum number of requirements (counts from
 *   requirements) that are accepted for the section to be fulfilled.
 */
export interface Section {
  type: "SECTION";
  title: string;
  requirements: Requirement[];
  minRequirementCount: number;
  warnings?: string[];
}

/** Represents a degree requirement that allows a Section to be completed. */
export type Requirement =
  | IXofManyCourse
  | IAndCourse
  | IOrCourse
  | ICourseRange
  | IRequiredCourse
  | Section;

/**
 * Represents a requirement where X number of credits need to be completed from
 * a list of courses.
 *
 * @param type          The type of requirement.
 * @param numCreditsMin The minimum number of credits needed to fulfill a given section.
 * @param courses       The list of requirements that the credits can be fulfilled from.
 */
export interface IXofManyCourse {
  type: "XOM";
  numCreditsMin: number;
  courses: Requirement[];
}

/**
 * Represents an 'AND' series of requirements.
 *
 * @param type    The type of requirement.
 * @param courses The list of requirements, all of which must be taken to
 *   satisfy this requirement.
 */
export interface IAndCourse {
  type: "AND";
  courses: Requirement[];
}

/**
 * Represents an 'OR' set of requirements.
 *
 * @param type    The type of requirement.
 * @param courses The list of requirements, one of which can be taken to satisfy
 *   this requirement.
 */
export interface IOrCourse {
  type: "OR";
  courses: Requirement[];
}

/**
 * Represents a requirement that specifies a range of courses.
 *
 * @param type         The type of requirement.
 * @param subject      The subject area of the range of courses.
 * @param idRangeStart The course ID for the starting range of course numbers.
 * @param idRangeEnd   The course ID for the ending range of course numbers.
 * @param exceptions   The requirements within the mentioned range that do not
 *   count towards fulfulling this requirement.
 */
export interface ICourseRange {
  type: "RANGE";
  subject: string;
  idRangeStart: number;
  idRangeEnd: number;
  exceptions: IRequiredCourse[];
}

/**
 * A single required course.
 *
 * @param classId - The numeric ID of the course.
 * @param subject - The subject that the course is concerned with, such as CS
 *   (Computer Science).
 */
export interface IRequiredCourse {
  type: "COURSE";
  classId: number;
  subject: string;
  description?: string;
}

export type SupportedConcentrations = {
  concentrations: string[];
  minRequiredConcentrations: number;
  verified: boolean;
};

// { majorName => { concentration, minRequiredConcentrations, verified} }
export type SupportedMajorsForYear = Record<string, SupportedConcentrations>;
export type SupportedMinorsForYear = Record<string, Minor>;

// { year => supported majors }
export type SupportedMajors = Record<string, SupportedMajorsForYear>;
export type SupportedMinors = Record<string, SupportedMinorsForYear>;

/**
 * Types for a some result from an algorithim. Currently used for the result of
 * the Major 2 validation algorithm.
 */
export enum ResultType {
  Ok = "Ok",
  Err = "Err",
}

export type Result<T, E> =
  | { ok: T; type: ResultType.Ok }
  | { err: E; type: ResultType.Err };

export const Ok = <T, E>(ok: T): Result<T, E> => ({ ok, type: ResultType.Ok });

export const Err = <T, E>(err: E): Result<T, E> => ({
  err,
  type: ResultType.Err,
});

export type Maybe<T> = T | false;

export interface MetaInfo {
  commit: Maybe<string>;
  commitMessage: Maybe<string>;
  build_timestamp: Maybe<number>;
  environment: Maybe<string>;
}

// option object type for react-select
export type OptionObject = {
  label: string | number;
  value: string | number;
};

export interface TemplateMetadata {
  branch: string;
}

export interface Template {
  name: string;
  yearVersion: number;
  metadata?: TemplateMetadata;
  templateData?: {
    [templateName: string]: {
      [yearKey: string]: {
        [termKey: string]: string[];
      };
    };
  };
};

// SidebarValidationStatus is used to determine the validation status of a section in the sidebar
export enum SidebarValidationStatus {
  Loading = "Loading",
  Error = "Error",
  Complete = "Complete",
  InProgress = "InProgress",
}

// --- Plan (4-year schedule, Fall/Spring only) for drag-and-drop ---

/** A course as placed in a plan slot (has dnd id). */
export interface PlanCourse {
  id: string;
  subject: string;
  classId: string;
  name: string;
}

/** A single term (e.g. Fall Year 1) with droppable id. */
export interface PlanTerm {
  id: string;
  season: SeasonEnum;
  classes: PlanCourse[];
}

/** One academic year: fall and spring only. */
export interface PlanYear {
  year: number;
  fall: PlanTerm;
  spring: PlanTerm;
}

/** Schedule is a list of years. */
export interface PlanSchedule {
  years: PlanYear[];
}

/** Full plan model for the graduate plan view. */
export interface Plan {
  schedule: PlanSchedule;
}
