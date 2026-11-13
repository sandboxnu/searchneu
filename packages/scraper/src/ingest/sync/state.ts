/**
 * Step 7 - what the catalog currently holds for a term.
 *
 * The only thing `plan` compares against. The catalog keys courses and
 * sections per term row rather than per term code, so a term code with
 * several partOfTerm rows is bucketed by part throughout.
 */

import { eq } from "drizzle-orm";
import {
  buildingsT,
  campusesT,
  courseNupathJoinT,
  coursesT,
  meetingTimesT,
  nupathsT,
  roomsT,
  sectionsT,
  subjectsT,
  termsT,
} from "@sneu/db/schema";
import type { Tx } from "../../upload/types";

export interface TermRow {
  id: number;
  partOfTerm: string;
  name: string;
  activeUntil: Date;
}

export interface CourseRow {
  id: number;
  termId: number;
  register: string;
  name: string;
  description: string;
  minCredits: string;
  maxCredits: string;
  prereqs: unknown;
  coreqs: unknown;
  postreqs: unknown;
  missingSince: Date | null;
  tombstonedAt: Date | null;
  updatedAt: Date;
}

export interface SectionRow {
  id: number;
  termId: number;
  courseId: number;
  crn: string;
  faculty: string;
  seatCapacity: number;
  seatRemaining: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
  classType: string;
  honors: boolean;
  campus: number;
  missingSince: Date | null;
  tombstonedAt: Date | null;
  updatedAt: Date;
}

export interface MeetingTimeRow {
  id: number;
  sectionId: number;
  roomId: number | null;
  days: number[];
  startTime: number;
  endTime: number;
}

export interface PartState {
  term: TermRow;
  /** keyed by register */
  courses: Map<string, CourseRow>;
  /** keyed by CRN */
  sections: Map<string, SectionRow>;
  /** keyed by section id */
  meetingTimes: Map<number, MeetingTimeRow[]>;
  /** keyed by course id */
  nupaths: Map<number, Set<number>>;
}

export interface Lookups {
  subjects: Map<string, number>;
  campusesByName: Map<string, number>;
  buildings: Map<string, number>;
  /** keyed "BUILDING:ROOM" */
  rooms: Map<string, number>;
  nupaths: Map<string, number>;
}

export interface TermState {
  term: string;
  /** keyed by partOfTerm */
  parts: Map<string, PartState>;
  lookups: Lookups;
}

export async function loadState(tx: Tx, term: string): Promise<TermState> {
  const terms = await tx
    .select({
      id: termsT.id,
      partOfTerm: termsT.partOfTerm,
      name: termsT.name,
      activeUntil: termsT.activeUntil,
    })
    .from(termsT)
    .where(eq(termsT.term, term));

  const parts = new Map<string, PartState>();
  const partByTermId = new Map<number, PartState>();
  for (const row of terms) {
    const part: PartState = {
      term: row,
      courses: new Map(),
      sections: new Map(),
      meetingTimes: new Map(),
      nupaths: new Map(),
    };
    parts.set(row.partOfTerm, part);
    partByTermId.set(row.id, part);
  }

  const state: TermState = {
    term,
    parts,
    lookups: await loadLookups(tx),
  };

  if (terms.length === 0) return state;

  const courses = await tx
    .select({
      id: coursesT.id,
      termId: coursesT.termId,
      register: coursesT.register,
      name: coursesT.name,
      description: coursesT.description,
      minCredits: coursesT.minCredits,
      maxCredits: coursesT.maxCredits,
      prereqs: coursesT.prereqs,
      coreqs: coursesT.coreqs,
      postreqs: coursesT.postreqs,
      missingSince: coursesT.missingSince,
      tombstonedAt: coursesT.tombstonedAt,
      updatedAt: coursesT.updatedAt,
    })
    .from(coursesT)
    .innerJoin(termsT, eq(coursesT.termId, termsT.id))
    .where(eq(termsT.term, term));

  for (const course of courses) {
    partByTermId.get(course.termId)?.courses.set(course.register, course);
  }

  const sections = await tx
    .select({
      id: sectionsT.id,
      termId: sectionsT.termId,
      courseId: sectionsT.courseId,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      seatCapacity: sectionsT.seatCapacity,
      seatRemaining: sectionsT.seatRemaining,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      classType: sectionsT.classType,
      honors: sectionsT.honors,
      campus: sectionsT.campus,
      missingSince: sectionsT.missingSince,
      tombstonedAt: sectionsT.tombstonedAt,
      updatedAt: sectionsT.updatedAt,
    })
    .from(sectionsT)
    .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
    .where(eq(termsT.term, term));

  const partBySectionId = new Map<number, PartState>();
  for (const section of sections) {
    const part = partByTermId.get(section.termId);
    if (!part) continue;
    part.sections.set(section.crn, section);
    partBySectionId.set(section.id, part);
  }

  const meetings = await tx
    .select({
      id: meetingTimesT.id,
      sectionId: meetingTimesT.sectionId,
      roomId: meetingTimesT.roomId,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
    })
    .from(meetingTimesT)
    .innerJoin(termsT, eq(meetingTimesT.termId, termsT.id))
    .where(eq(termsT.term, term));

  for (const meeting of meetings) {
    const part = partBySectionId.get(meeting.sectionId);
    if (!part) continue;
    const existing = part.meetingTimes.get(meeting.sectionId);
    if (existing) existing.push(meeting);
    else part.meetingTimes.set(meeting.sectionId, [meeting]);
  }

  const joins = await tx
    .select({
      courseId: courseNupathJoinT.courseId,
      nupathId: courseNupathJoinT.nupathId,
      termId: coursesT.termId,
    })
    .from(courseNupathJoinT)
    .innerJoin(coursesT, eq(courseNupathJoinT.courseId, coursesT.id))
    .innerJoin(termsT, eq(coursesT.termId, termsT.id))
    .where(eq(termsT.term, term));

  for (const join of joins) {
    const part = partByTermId.get(join.termId);
    if (!part) continue;
    const existing = part.nupaths.get(join.courseId);
    if (existing) existing.add(join.nupathId);
    else part.nupaths.set(join.courseId, new Set([join.nupathId]));
  }

  return state;
}

/**
 * Reference data is config as code; an unresolvable code is drift.
 *
 * One after another: a transaction is a single connection, which runs one
 * query at a time regardless.
 */
async function loadLookups(tx: Tx): Promise<Lookups> {
  const subjects = await tx
    .select({ id: subjectsT.id, code: subjectsT.code })
    .from(subjectsT);
  const campuses = await tx
    .select({ id: campusesT.id, name: campusesT.name })
    .from(campusesT);
  const buildings = await tx
    .select({ id: buildingsT.id, code: buildingsT.code })
    .from(buildingsT);
  const rooms = await tx
    .select({ id: roomsT.id, code: roomsT.code, building: buildingsT.code })
    .from(roomsT)
    .innerJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id));
  const nupaths = await tx
    .select({ id: nupathsT.id, code: nupathsT.code })
    .from(nupathsT);

  return {
    subjects: new Map(subjects.map((s) => [s.code, s.id])),
    campusesByName: new Map(campuses.map((c) => [c.name, c.id])),
    buildings: new Map(buildings.map((b) => [b.code, b.id])),
    rooms: new Map(rooms.map((r) => [`${r.building}:${r.code}`, r.id])),
    nupaths: new Map(nupaths.map((n) => [n.code, n.id])),
  };
}
