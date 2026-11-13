/** Fixture builders for the sync tests. Not exported from the package. */

import type {
  CourseRow,
  Lookups,
  MeetingTimeRow,
  PartState,
  SectionRow,
  TermState,
} from "./state";

export const TERM = "202610";

export function lookups(overrides: Partial<Lookups> = {}): Lookups {
  return {
    subjects: new Map([["CS", 1]]),
    campusesByName: new Map([["Boston", 10]]),
    buildings: new Map([["SN", 20]]),
    rooms: new Map([["SN:108", 30]]),
    nupaths: new Map([["NCND", 40]]),
    ...overrides,
  };
}

export function courseRow(overrides: Partial<CourseRow> = {}): CourseRow {
  return {
    id: 100,
    termId: 1,
    register: "CS2500",
    name: "Fundamentals of Computer Science 1",
    description: "A course.",
    minCredits: "4",
    maxCredits: "4",
    prereqs: {},
    coreqs: {},
    postreqs: {},
    missingSince: null,
    tombstonedAt: null,
    updatedAt: new Date("2026-01-20T00:00:00.000Z"),
    ...overrides,
  };
}

export function sectionRow(overrides: Partial<SectionRow> = {}): SectionRow {
  return {
    id: 200,
    termId: 1,
    courseId: 100,
    crn: "70001",
    faculty: "Lovelace, Ada",
    seatCapacity: 100,
    seatRemaining: 10,
    waitlistCapacity: 20,
    waitlistRemaining: 15,
    classType: "Lecture",
    honors: false,
    campus: 10,
    missingSince: null,
    tombstonedAt: null,
    updatedAt: new Date("2026-01-20T00:00:00.000Z"),
    ...overrides,
  };
}

export function meetingRow(
  overrides: Partial<MeetingTimeRow> = {},
): MeetingTimeRow {
  return {
    id: 300,
    sectionId: 200,
    roomId: 30,
    days: [1, 3, 4],
    startTime: 935,
    endTime: 1115,
    ...overrides,
  };
}

export function termState(
  options: {
    parts?: {
      partOfTerm?: string;
      termId?: number;
      name?: string;
      activeUntil?: Date;
      courses?: CourseRow[];
      sections?: SectionRow[];
      meetingTimes?: MeetingTimeRow[];
      nupaths?: [number, number[]][];
    }[];
    lookups?: Partial<Lookups>;
  } = {},
): TermState {
  const parts = new Map<string, PartState>();

  for (const spec of options.parts ?? [{}]) {
    const partOfTerm = spec.partOfTerm ?? "1";
    const part: PartState = {
      term: {
        id: spec.termId ?? 1,
        partOfTerm,
        name: spec.name ?? "Spring 2026",
        activeUntil: spec.activeUntil ?? new Date("2026-05-01T00:00:00.000Z"),
      },
      courses: new Map((spec.courses ?? []).map((c) => [c.register, c])),
      sections: new Map((spec.sections ?? []).map((s) => [s.crn, s])),
      meetingTimes: new Map(),
      nupaths: new Map(
        (spec.nupaths ?? []).map(([courseId, ids]) => [courseId, new Set(ids)]),
      ),
    };

    for (const meeting of spec.meetingTimes ?? []) {
      const existing = part.meetingTimes.get(meeting.sectionId);
      if (existing) existing.push(meeting);
      else part.meetingTimes.set(meeting.sectionId, [meeting]);
    }

    parts.set(partOfTerm, part);
  }

  return { term: TERM, parts, lookups: lookups(options.lookups) };
}
