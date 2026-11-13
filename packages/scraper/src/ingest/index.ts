/** The ingest pipeline: Banner into a TermSnapshot, then into the database. */

export { BannerClient, BannerError } from "./client";
export type { BannerClientOptions, BannerClientStats } from "./client";

export { sweep, SweepError } from "./sweep";
export type { SweepResult, SweepPage } from "./sweep";

export { assemble } from "./assemble";
export type { TermSnapshot } from "../schemas/scraper/snapshot";
export { derive } from "./derive";

export { dueCourses } from "./details/due";
export type { DueCourse, DueOptions } from "./details/due";
export { execute } from "./details/execute";
export type {
  CourseScrape,
  SectionScrape,
  ScrapeFailure,
  ExecuteResult,
} from "./details/execute";
export { applyScrapes } from "./details/patch";

export { loadState } from "./sync/state";
export type { PartState as TermPartState } from "./sync/state";
export type {
  TermState,
  PartState,
  Lookups,
  TermRow,
  CourseRow,
  SectionRow,
  MeetingTimeRow,
} from "./sync/state";

export { hydrate } from "./sync/hydrate";

export { plan } from "./sync/plan";
export type {
  Plan,
  PartPlan,
  PlanOptions,
  PlanProblem,
  PlanStats,
  PassKind,
  TermPlanConfig,
  CourseInsert,
  CourseUpdate,
  SectionInsert,
  SectionUpdate,
  MeetingTimeInsert,
  CourseValues,
  SectionValues,
} from "./sync/plan";

export { check } from "./sync/check";
export type {
  CheckResult,
  CheckInput,
  RailsConfig,
  Violation,
} from "./sync/check";

export { apply, notificationsFrom } from "./sync/apply";
export type { Changeset, PartChangeset, NotifiableSection } from "./sync/apply";

export { record } from "./sync/record";
export type { RunRecord, RunStatus } from "./sync/record";

export { planTombstones } from "./sync/tombstone";
export type {
  TombstoneCandidate,
  TombstoneChange,
  TombstonePolicy,
} from "./sync/tombstone";

export { buildSnapshot } from "./pipeline";
export type { SnapshotRun } from "./pipeline";

export {
  BANNER,
  SECTION_PAGE_SIZE,
  COURSE_TTL_MS,
  COURSE_BUDGET,
  TOMBSTONE,
  MODE,
  APPLY_TERMS,
  PASS_EVERY_MS,
  RAILS,
} from "./config";
export type { Mode } from "./config";
