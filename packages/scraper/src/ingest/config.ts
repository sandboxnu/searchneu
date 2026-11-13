export const BANNER = {
  baseUrl: "https://nubanner.neu.edu",
  maxConcurrent: 20,
  /** 0 relies on maxConcurrent alone */
  minDelayMs: 0,
  /** retries after the first attempt */
  maxRetries: 5,
  initialRetryDelayMs: 1_000,
  maxRetryDelayMs: 30_000,
  /** per attempt, not per request */
  timeoutMs: 60_000,
  /** Banner binds the term to the session cookie, so pages need one each */
  sessionPool: 20,
} as const;

/** Banner's maximum sections per search page. */
export const SECTION_PAGE_SIZE = 500;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long a course's scrape lasts, counted from `courses.updatedAt`. A
 * scrape reads all of the course's detail and its sections' faculty, and
 * writes everything about the course and its sections.
 */
export const COURSE_TTL_MS = 7 * DAY;

/**
 * Courses one pass may scrape; the rest wait for the next. A course costs
 * about four requests plus one per section.
 */
export const COURSE_BUDGET = 250;

/** How long a row must be missing from the sweep before it is tombstoned. */
export const TOMBSTONE = {
  afterMs: 6 * HOUR,
};

export type Mode = "shadow" | "apply";

/** "shadow" runs the whole pipeline and writes nothing to the catalog. */
export const MODE: Mode = "shadow";

/** Terms the daemon writes once MODE is "apply". Empty means all of them. */
export const APPLY_TERMS: readonly string[] = [];

/**
 * Every pass writes seats and waitlists, updates tombstones, then scrapes
 * whichever courses are due.
 */
export const PASS_EVERY_MS = 5 * MINUTE;

/**
 * Blocks a plan that looks like a Banner outage rather than catalog churn.
 * Ratios are of the term's own size.
 */
export const RAILS = {
  missingSections: { warnRatio: 0.02, blockRatio: 0.1, blockCount: 500 },
  missingCourses: { warnRatio: 0.01, blockRatio: 0.05 },
  sectionCountDrop: { blockRatio: 0.1 },
  detailFailures: { warnRatio: 0.05, blockRatio: 0.25 },
  blockOnTruncatedSweep: true,
  blockOnSectionCourseMove: true,
  blockOnUnresolvedConfig: true,
};
