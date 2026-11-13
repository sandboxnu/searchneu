/**
 * Step 8 - what the pass would write. Pure, no database access.
 *
 * Two kinds of plan, both run every pass.
 *
 * Light: seats and waitlists on sections the catalog already has, and
 * tombstones. Nothing else, so seats never wait on a course scrape.
 *
 * Deep: everything about the courses scraped this pass - detail, credits,
 * faculty, meeting times, nupaths and inserts. Every other course is left
 * alone, so nothing is written from data that was not read this pass.
 *
 * Inserts carry natural keys (registers, CRNs, building codes) because the
 * rows they point at may not exist yet. Resolving them is `apply`'s job.
 */

import type {
  SnapshotCourse,
  SnapshotSection,
  TermSnapshot,
} from "../../schemas/scraper/snapshot";
import {
  planTombstones,
  type TombstoneChange,
  type TombstonePolicy,
} from "./tombstone";
import type {
  CourseRow,
  MeetingTimeRow,
  PartState,
  SectionRow,
  TermState,
} from "./state";

export type PassKind = "light" | "deep";

export interface CourseValues {
  name: string;
  description: string;
  minCredits: string;
  maxCredits: string;
  prereqs: unknown;
  coreqs: unknown;
  postreqs: unknown;
}

export interface SectionValues {
  faculty: string;
  seatCapacity: number;
  seatRemaining: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
  classType: string;
  honors: boolean;
  campus: number;
}

export interface CourseInsert {
  register: string;
  subjectId: number;
  courseNumber: string;
  values: CourseValues;
}

export interface CourseUpdate {
  id: number;
  register: string;
  changes: Partial<CourseValues>;
  before: Partial<CourseValues>;
}

export interface SectionInsert {
  crn: string;
  register: string;
  values: SectionValues;
}

export interface SectionUpdate {
  id: number;
  crn: string;
  changes: Partial<SectionValues>;
  before: Partial<SectionValues>;
}

export interface MeetingTimeInsert {
  crn: string;
  building: string | null;
  room: string | null;
  days: number[];
  startTime: number;
  endTime: number;
}

export interface PartPlan {
  partOfTerm: string;
  termRow: {
    /** the ingester never creates a term row; that is the CLI's job */
    op: "update" | "noop";
    /** null only when the row does not exist yet */
    termId: number | null;
    name: string;
    activeUntil: Date;
  };
  courses: { insert: CourseInsert[]; update: CourseUpdate[] };
  sections: { insert: SectionInsert[]; update: SectionUpdate[] };
  meetingTimes: { insert: MeetingTimeInsert[]; delete: number[] };
  nupaths: {
    insert: { register: string; nupathId: number }[];
    delete: { courseId: number; nupathId: number }[];
  };
  tombstones: { courses: TombstoneChange[]; sections: TombstoneChange[] };
  /**
   * Rows scraped this pass, changed or not. Their `updatedAt` is touched so
   * the course TTL counts from this scrape.
   */
  confirmed: { courses: number[]; sections: number[] };
}

/** Becomes an `ingest_drift` row. */
export interface PlanProblem {
  kind: string;
  entity: string;
  key: string;
  detail?: Record<string, unknown>;
}

export interface PlanStats {
  courseInserts: number;
  courseUpdates: number;
  sectionInserts: number;
  sectionUpdates: number;
  meetingTimeInserts: number;
  meetingTimeDeletes: number;
  missingCourses: number;
  missingSections: number;
  tombstoned: number;
  restored: number;
  snapshotSections: number;
  stateSections: number;
  stateCourses: number;
}

export interface Plan {
  term: string;
  pass: PassKind;
  parts: PartPlan[];
  problems: PlanProblem[];
  stats: PlanStats;
}

export interface TermPlanConfig {
  name: string;
  activeUntil: Date;
  splitByPartOfTerm?: boolean;
  parts?: { code: string; name?: string; activeUntil?: Date }[];
}

export interface PlanOptions {
  pass: PassKind;
  now: Date;
  tombstone: TombstonePolicy;
  /** registers scraped this pass; only these are written by a deep plan */
  scraped?: ReadonlySet<string>;
}

export function plan(
  snapshot: TermSnapshot,
  state: TermState,
  config: TermPlanConfig,
  options: PlanOptions,
): Plan {
  const problems: PlanProblem[] = [];

  const roomKeys = new Map(
    [...state.lookups.rooms].map(([key, id]) => [id, key]),
  );

  const parts: PartPlan[] = [];
  let sectionsConsidered = 0;

  for (const partOfTerm of partsOf(state, config)) {
    const partState = state.parts.get(partOfTerm);
    if (!partState) continue;

    const sectionsByRegister = sectionsForPart(snapshot, config, partOfTerm);
    const part = emptyPart(
      partOfTerm,
      termRowFor(config, partOfTerm, partState),
    );

    if (options.pass === "light") {
      planLight(sectionsByRegister, partState, part, options);
    } else {
      planDeep(snapshot, sectionsByRegister, state, partState, part, {
        problems,
        roomKeys,
        scraped: options.scraped ?? new Set(),
      });
    }

    parts.push(part);
    sectionsConsidered += [...sectionsByRegister.values()].flat().length;
  }

  return {
    term: snapshot.term.code,
    pass: options.pass,
    parts,
    problems,
    stats: summarise(parts, sectionsConsidered, state),
  };
}

/**
 * The parts to write, taken from the state the caller passed in. Banner part
 * codes with no row here are not planned at all, which is how a finished
 * session stays frozen and an unconfigured one is dropped.
 */
function partsOf(state: TermState, config: TermPlanConfig): string[] {
  const codes = [...state.parts.keys()].sort();
  // an unsplit term has a single row that holds every section
  return config.splitByPartOfTerm ? codes : codes.slice(0, 1);
}

function emptyPart(partOfTerm: string, termRow: PartPlan["termRow"]): PartPlan {
  return {
    partOfTerm,
    termRow,
    courses: { insert: [], update: [] },
    sections: { insert: [], update: [] },
    meetingTimes: { insert: [], delete: [] },
    nupaths: { insert: [], delete: [] },
    tombstones: { courses: [], sections: [] },
    confirmed: { courses: [], sections: [] },
  };
}

/** Seats and waitlists on existing sections, and tombstones. */
function planLight(
  sectionsByRegister: Map<string, SnapshotSection[]>,
  partState: PartState,
  part: PartPlan,
  options: PlanOptions,
): void {
  const liveRegisters = new Set<string>();
  const liveCrns = new Set<string>();

  for (const [register, sections] of sectionsByRegister) {
    liveRegisters.add(register);

    for (const section of sections) {
      liveCrns.add(section.crn);

      const row = partState.sections.get(section.crn);
      if (!row) continue;

      const changes = seatChanges(section, row);
      if (Object.keys(changes).length > 0) {
        part.sections.update.push({
          id: row.id,
          crn: section.crn,
          changes,
          before: priorValues(changes, sectionValuesFromRow(row)),
        });
      }
    }
  }

  // liveness comes from the sweep alone, so it never waits on a scrape
  part.tombstones = {
    courses: planTombstones(
      tombstoneRows(partState.courses),
      liveRegisters,
      options.tombstone,
      options.now,
    ),
    sections: planTombstones(
      tombstoneRows(partState.sections),
      liveCrns,
      options.tombstone,
      options.now,
    ),
  };
}

/** Everything about the courses scraped this pass. */
function planDeep(
  snapshot: TermSnapshot,
  sectionsByRegister: Map<string, SnapshotSection[]>,
  state: TermState,
  partState: PartState,
  part: PartPlan,
  context: {
    problems: PlanProblem[];
    /** "BUILDING:ROOM" by room id */
    roomKeys: Map<number, string>;
    scraped: ReadonlySet<string>;
  },
): void {
  const { problems, roomKeys, scraped } = context;

  for (const course of snapshot.courses) {
    const register = course.subject + course.courseNumber;
    const sections = sectionsByRegister.get(register);
    if (!sections || !scraped.has(register)) continue;

    const subjectId = state.lookups.subjects.get(course.subject);
    if (subjectId === undefined) {
      problems.push({
        kind: "unknown-subject",
        entity: "subject",
        key: course.subject,
        detail: { register },
      });
      continue;
    }

    const row = partState.courses.get(register);
    if (!row) {
      part.courses.insert.push({
        register,
        subjectId,
        courseNumber: course.courseNumber,
        values: courseValues(course),
      });
    } else {
      const changes = changed(courseValues(course), courseValuesFromRow(row));
      if (Object.keys(changes).length > 0) {
        part.courses.update.push({
          id: row.id,
          register,
          changes,
          before: priorValues(changes, courseValuesFromRow(row)),
        });
      }
      part.confirmed.courses.push(row.id);
    }

    planNupaths(course, register, row, state, part);

    for (const section of sections) {
      const campus = state.lookups.campusesByName.get(section.campus);
      if (campus === undefined) {
        problems.push({
          kind: "unknown-campus",
          entity: "campus",
          key: section.campus,
          detail: { crn: section.crn },
        });
        continue;
      }

      const sectionRow = partState.sections.get(section.crn);
      if (!sectionRow) {
        part.sections.insert.push({
          crn: section.crn,
          register,
          values: sectionValues(section, campus),
        });
      } else {
        if (row && sectionRow.courseId !== row.id) {
          problems.push({
            kind: "section-course-moved",
            entity: "section",
            key: section.crn,
            detail: { from: sectionRow.courseId, to: row.id },
          });
        }

        const changes = changed(
          sectionValues(section, campus),
          sectionValuesFromRow(sectionRow),
        );
        if (Object.keys(changes).length > 0) {
          part.sections.update.push({
            id: sectionRow.id,
            crn: section.crn,
            changes,
            before: priorValues(changes, sectionValuesFromRow(sectionRow)),
          });
        }
        part.confirmed.sections.push(sectionRow.id);
      }

      planMeetingTimes(section, sectionRow, state, part, problems, roomKeys);
    }
  }
}

function sectionsForPart(
  snapshot: TermSnapshot,
  config: TermPlanConfig,
  partOfTerm: string,
): Map<string, SnapshotSection[]> {
  const result = new Map<string, SnapshotSection[]>();

  for (const [register, sections] of Object.entries(snapshot.sections)) {
    const matching = config.splitByPartOfTerm
      ? sections.filter((s) => s.partOfTerm === partOfTerm)
      : sections;
    if (matching.length > 0) result.set(register, matching);
  }

  return result;
}

function termRowFor(
  config: TermPlanConfig,
  partOfTerm: string,
  partState: PartState,
): PartPlan["termRow"] {
  const override = config.parts?.find((p) => p.code === partOfTerm);
  const name = override?.name ?? config.name;
  const activeUntil = override?.activeUntil ?? config.activeUntil;

  const isChanged =
    partState.term.name !== name ||
    partState.term.activeUntil.getTime() !== activeUntil.getTime();

  return {
    op: isChanged ? "update" : "noop",
    termId: partState.term.id,
    name,
    activeUntil,
  };
}

function courseValues(course: SnapshotCourse): CourseValues {
  return {
    name: course.name,
    description: course.description,
    minCredits: String(course.minCredits),
    maxCredits: String(course.maxCredits),
    prereqs: course.prereqs,
    coreqs: course.coreqs,
    postreqs: course.postreqs,
  };
}

function courseValuesFromRow(row: CourseRow): CourseValues {
  return {
    name: row.name,
    description: row.description,
    minCredits: row.minCredits,
    maxCredits: row.maxCredits,
    prereqs: row.prereqs,
    coreqs: row.coreqs,
    postreqs: row.postreqs,
  };
}

function sectionValues(
  section: SnapshotSection,
  campus: number,
): SectionValues {
  return {
    faculty: section.faculty.find((f) => f.primary)?.displayName ?? "NA",
    seatCapacity: section.seatCapacity,
    seatRemaining: section.seatRemaining,
    waitlistCapacity: section.waitlistCapacity,
    waitlistRemaining: section.waitlistRemaining,
    classType: section.classType,
    honors: section.honors,
    campus,
  };
}

function sectionValuesFromRow(row: SectionRow): SectionValues {
  return {
    faculty: row.faculty,
    seatCapacity: row.seatCapacity,
    seatRemaining: row.seatRemaining,
    waitlistCapacity: row.waitlistCapacity,
    waitlistRemaining: row.waitlistRemaining,
    classType: row.classType,
    honors: row.honors,
    campus: row.campus,
  };
}

const SEAT_FIELDS = [
  "seatCapacity",
  "seatRemaining",
  "waitlistCapacity",
  "waitlistRemaining",
] as const;

function seatChanges(
  section: SnapshotSection,
  row: SectionRow,
): Partial<SectionValues> {
  const changes: Partial<SectionValues> = {};
  for (const field of SEAT_FIELDS) {
    if (section[field] !== row[field]) changes[field] = section[field];
  }
  return changes;
}

/** The fields of `next` that differ from `prior`. */
function changed<T extends object>(next: T, prior: T): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (differs(next[key], prior[key])) changes[key] = next[key];
  }
  return changes;
}

function planMeetingTimes(
  section: SnapshotSection,
  row: SectionRow | undefined,
  state: TermState,
  part: PartPlan,
  problems: PlanProblem[],
  roomKeys: Map<number, string>,
): void {
  const listed = section.meetingTimes.filter((mt) => !mt.final);

  for (const mt of listed) {
    if (mt.building && !state.lookups.buildings.has(mt.building)) {
      problems.push({
        kind: "unknown-building",
        entity: "building",
        key: mt.building,
        detail: { crn: section.crn },
      });
    }
  }

  const wanted = onePerSlot(listed);

  // the room is part of the key, so a room change is a delete and an insert
  const wantedKey = (mt: (typeof wanted)[number]) =>
    meetingKey(
      mt.days,
      mt.startTime,
      mt.endTime,
      mt.building && mt.room ? `${mt.building}:${mt.room}` : "",
    );
  const existingKey = (mt: MeetingTimeRow) =>
    meetingKey(
      mt.days,
      mt.startTime,
      mt.endTime,
      mt.roomId === null ? "" : (roomKeys.get(mt.roomId) ?? ""),
    );

  const wantedKeys = new Set(wanted.map(wantedKey));
  const existing = row ? meetingsOf(state, row.id) : [];
  const existingKeys = new Set(existing.map(existingKey));

  for (const mt of wanted) {
    if (existingKeys.has(wantedKey(mt))) continue;
    part.meetingTimes.insert.push({
      crn: section.crn,
      building: mt.building,
      room: mt.room,
      days: mt.days,
      startTime: mt.startTime,
      endTime: mt.endTime,
    });
  }

  for (const mt of existing) {
    if (!wantedKeys.has(existingKey(mt))) {
      part.meetingTimes.delete.push(mt.id);
    }
  }
}

/**
 * The catalog holds one meeting per days and times. Banner lists a hybrid
 * section's meeting twice, with and without a room, so the one with a room
 * is kept.
 */
function onePerSlot<
  T extends {
    days: number[];
    startTime: number;
    endTime: number;
    building: string | null;
    room: string | null;
  },
>(meetings: T[]): T[] {
  const hasRoom = (mt: T) => Boolean(mt.building && mt.room);
  const bySlot = new Map<string, T>();

  for (const mt of meetings) {
    const slot = meetingKey(mt.days, mt.startTime, mt.endTime, "");
    const kept = bySlot.get(slot);
    if (!kept || (!hasRoom(kept) && hasRoom(mt))) bySlot.set(slot, mt);
  }

  return [...bySlot.values()];
}

function meetingsOf(state: TermState, sectionId: number) {
  for (const part of state.parts.values()) {
    const meetings = part.meetingTimes.get(sectionId);
    if (meetings) return meetings;
  }
  return [];
}

function meetingKey(
  days: number[],
  startTime: number,
  endTime: number,
  room: string,
) {
  return `${days.join(",")}-${startTime}-${endTime}-${room}`;
}

function planNupaths(
  course: SnapshotCourse,
  register: string,
  row: CourseRow | undefined,
  state: TermState,
  part: PartPlan,
): void {
  const wanted = new Set<number>();
  for (const attribute of course.attributes) {
    const nupathId = state.lookups.nupaths.get(attribute);
    if (nupathId !== undefined) wanted.add(nupathId);
  }

  const existing = row
    ? (state.parts.get(part.partOfTerm)?.nupaths.get(row.id) ?? new Set())
    : new Set<number>();

  for (const nupathId of wanted) {
    if (!existing.has(nupathId)) {
      part.nupaths.insert.push({ register, nupathId });
    }
  }

  if (row) {
    for (const nupathId of existing) {
      if (!wanted.has(nupathId)) {
        part.nupaths.delete.push({ courseId: row.id, nupathId });
      }
    }
  }
}

function tombstoneRows(rows: Map<string, CourseRow | SectionRow>) {
  return [...rows.entries()].map(([key, row]) => ({
    id: row.id,
    key,
    missingSince: row.missingSince,
    tombstonedAt: row.tombstonedAt,
  }));
}

function priorValues<T extends object>(
  changes: Partial<T>,
  prior: T,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(changes) as (keyof T)[]) {
    result[key] = prior[key];
  }
  return result;
}

function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function summarise(
  parts: PartPlan[],
  sectionsConsidered: number,
  state: TermState,
): PlanStats {
  const tombstones = parts.flatMap((p) => [
    ...p.tombstones.courses,
    ...p.tombstones.sections,
  ]);

  // a tombstoned row stays until it is reaped by hand, so counting it would
  // let the rails drift further from the term's real size every pass
  let stateSections = 0;
  let stateCourses = 0;
  for (const part of state.parts.values()) {
    for (const row of part.sections.values()) {
      if (!row.tombstonedAt) stateSections++;
    }
    for (const row of part.courses.values()) {
      if (!row.tombstonedAt) stateCourses++;
    }
  }

  return {
    courseInserts: sum(parts, (p) => p.courses.insert.length),
    courseUpdates: sum(parts, (p) => p.courses.update.length),
    sectionInserts: sum(parts, (p) => p.sections.insert.length),
    sectionUpdates: sum(parts, (p) => p.sections.update.length),
    meetingTimeInserts: sum(parts, (p) => p.meetingTimes.insert.length),
    meetingTimeDeletes: sum(parts, (p) => p.meetingTimes.delete.length),
    missingCourses: sum(
      parts,
      (p) => p.tombstones.courses.filter((c) => c.action !== "restore").length,
    ),
    missingSections: sum(
      parts,
      (p) => p.tombstones.sections.filter((c) => c.action !== "restore").length,
    ),
    tombstoned: tombstones.filter((c) => c.action === "tombstone").length,
    restored: tombstones.filter((c) => c.action === "restore").length,
    snapshotSections: sectionsConsidered,
    stateSections,
    stateCourses,
  };
}

function sum(parts: PartPlan[], of: (part: PartPlan) => number): number {
  return parts.reduce((total, part) => total + of(part), 0);
}
