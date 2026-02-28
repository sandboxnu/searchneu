/**
 * Catalog domain types — shared between server and client.
 *
 * This file contains pure TypeScript interfaces for all catalog entities.
 * It has NO server-only imports and is safe to use in client components,
 * API route response types, and server-side DAL code alike.
 *
 * DAL functions return these types. API routes serialize them as JSON.
 * Client components use them to type fetched data.
 */

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

/**
 * a minimal term record used for navigation and term-selection UI.
 * only includes the fields needed when listing all available terms.
 */
export interface Term {
  term: string;
  name: string;
}

/**
 * all terms grouped by college, sorted most-recent-first within each
 * group
 *
 *
 *  TODO: verify these code translations with the new catalog changes
 *
 * the term code's 6th character (index 5) determines the college:
 *  - `"0"` → NEU semester
 *  - `"4"` → CPS semester  |  `"5"` → CPS quarter
 *  - `"2"` → Law semester  |  `"8"` → Law quarter
 */
export interface GroupedTerms {
  neu: Term[];
  cps: Term[];
  law: Term[];
}

/**
 * full term record including timestamps
 *
 * used when a caller needs to determine whether a term is currently
 * active (`activeUntil`) or when Banner data was last refreshed (`updatedAt`)
 */
export interface TermDetail {
  term: string;
  name: string;
  activeUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

/**
 * a course as returned by the DAL. includes aggregated nupath data and resolves
 * subjects to their readable codes
 */
export interface Course {
  id: number;
  name: string;
  /** Integer FK to the subjects table. Use `subjectCode` for the display code. */
  subject: number;
  /** Human-readable subject code, e.g. `"CS"`. Resolved via the subjects join. */
  subjectCode: string;
  courseNumber: string;
  /** Human-readable registration string, e.g. `"CS 3500"`. */
  register: string;
  description: string;
  minCredits: string;
  maxCredits: string;
  // TODO: add Requisite types to these
  prereqs: unknown;
  coreqs: unknown;
  postreqs: unknown;
  updatedAt: Date;
  /** Short nupath codes in display order, e.g. `["ND", "AD"]`. Empty if none. */
  nupaths: string[];
  /** Full nupath names in the same order as `nupaths`. */
  nupathNames: string[];
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/**
 * a building that a room is located within
 */
export interface Building {
  id: number;
  name: string;
}

/**
 * a physical room where a section meets. `building` is `undefined` when the
 * room record has no associated building (e.g. a TBA online room)
 */
export interface Room {
  id: number;
  /** Room code as stored in Banner, e.g. `"225"`. */
  number: string;
  building?: Building;
}

/**
 * a single scheduled meeting block for a section
 *
 * `days` is an array of integers where each value represents a day of the week
 * (0 = Sunday … 6 = Saturday, matching JavaScript's `Date.getDay()`)
 *
 * `startTime` and `endTime` are stored as integers in HHMM format, e.g.
 * `830` = 8:30 AM and `1420` = 2:20 PM
 */
export interface MeetingTime {
  days: number[];
  startTime: number;
  endTime: number;
  room?: Room;
}

/**
 * a single section of a course, with all meeting times pre-grouped.
 *
 * `seatRemaining` and `seatCapacity` reflect the current Banner snapshot and
 * are refreshed periodically while the term is active.
 */
export interface Section {
  id: number;
  crn: string;
  faculty: string;
  campus: string;
  honors: boolean;
  classType: string;
  seatRemaining: number;
  seatCapacity: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
  meetingTimes: MeetingTime[];
}

// ---------------------------------------------------------------------------
// Reference / filter data
// ---------------------------------------------------------------------------

/**
 * a subject
 */
export interface Subject {
  id: number;
  /** short identifier used in URLs and registers, e.g. `"CS"` */
  code: string;
  /** full (human readable) name, e.g. `"Computer Science"` */
  name: string;
}

/**
 * a NUpath record
 */
export interface Nupath {
  id: number;
  /** abbreviated display code shown in badges, e.g. `"ND"` */
  short: string;
  /** Internal Banner code, e.g. `"NU Core ND"` */
  code: string;
  /** full human-readable name, e.g. `"Natural and Designed World"` */
  name: string;
}

/**
 * a campus location record
 */
export interface Campus {
  id: number;
  /** full display name, e.g. `"Boston"` */
  name: string;
  /** short Banner identifier (when possible), e.g. `"BOS"` */
  code: string;
  /** where the campus belongs, usually grouped by country. mainly
   * utilized by the UI */
  group: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Input filters for the course search query. All array fields are treated as
 * OR within the field and AND across fields. An empty array means "no filter"
 * for that dimension.
 *
 * `minCourseLevel` and `maxCourseLevel` represent the thousand-level of the
 * course number — e.g. `1` filters to 1000–1999, `4` to 4000–4999.
 * Use `-1` to indicate no bound.
 */
export interface SearchFilters {
  /** 6-character Banner term code, e.g. `"202510"`. Required. */
  term: string;
  /** Free-text query matched against course name and register string. Empty string means no text filter. */
  query: string;
  /** Subject codes to include, e.g. `["CS", "DS"]`. Empty means all subjects. */
  subjects: string[];
  /** Minimum course level (thousands digit). -1 means no lower bound. */
  minCourseLevel: number;
  /** Maximum course level (thousands digit). -1 means no upper bound. */
  maxCourseLevel: number;
  /** NUpath short codes to require, e.g. `["ND", "AD"]`. Empty means no nupath filter. */
  nupaths: string[];
  /** Campus names to include. Empty means all campuses. */
  campuses: string[];
  /** Class type strings to include, e.g. `["Lecture", "Lab"]`. Empty means all types. */
  classTypes: string[];
  /** When true, only include courses with at least one honors section. */
  honors: boolean;
}

/**
 * A single row in the course search results. Unlike `Course`, this type
 * aggregates section-level data (seat counts, campus list, class types) so the
 * search UI can display availability without a second query per course.
 *
 * `subject` here is the code string (e.g. `"CS"`), not the integer FK.
 */
export interface SearchResult {
  id: number;
  name: string;
  courseNumber: string;
  /** Subject code string, e.g. `"CS"`. */
  subject: string;
  maxCredits: string;
  minCredits: string;
  nupaths: string[];
  nupathNames: string[];
  prereqs: unknown;
  coreqs: unknown;
  postreqs: unknown;
  /** Total number of sections for this course in the term. */
  totalSections: number;
  /** Number of sections that still have at least one open seat. */
  sectionsWithSeats: number;
  /** Distinct campus names across all sections. */
  campus: string[];
  /** Distinct class types across all sections, e.g. `["Lecture", "Lab"]`. */
  classType: string[];
  /** True if any section is an honors section. */
  honors: boolean;
  /** ParadeDB BM25 relevance score. Higher is more relevant. */
  score: number;
}
