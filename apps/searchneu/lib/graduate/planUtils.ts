import {
  CollisionDetection,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { produce } from "immer";
import { SeasonEnum, StatusEnum } from "./types";
import type { Audit, AuditTerm } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────

export const SIDEBAR_COURSE_PREFIX = "sidebar-";
export const DELETE_ZONE_ID = "delete-zone";

// ── ID Counter ───────────────────────────────────────────────────────────────

let _idCounter = 0;

export function nextId(): number {
  return ++_idCounter;
}

// ── DnD ID assignment / stripping ────────────────────────────────────────────

export function assignDndIds(schedule: Audit): Audit {
  return {
    years: (schedule.years ?? []).map((year) => ({
      ...year,
      fall: assignTermIds(year.fall, year.year),
      spring: assignTermIds(year.spring, year.year),
      summer1: assignTermIds(year.summer1, year.year),
      summer2: assignTermIds(year.summer2, year.year),
    })),
  };
}

function assignTermIds(term: AuditTerm, yearNum: number): AuditTerm {
  return {
    ...term,
    id: `${yearNum}-${term.season}`,
    classes: term.classes.map((c) => ({
      ...c,
      id: `${c.subject}-${c.classId}-${nextId()}`,
    })),
  };
}

export function stripDndIds(schedule: Audit): Audit {
  return {
    years: schedule.years.map((year) => ({
      ...year,
      fall: stripTermIds(year.fall),
      spring: stripTermIds(year.spring),
      summer1: stripTermIds(year.summer1),
      summer2: stripTermIds(year.summer2),
    })),
  };
}

function stripTermIds(term: AuditTerm): AuditTerm {
  return {
    ...term,
    id: null,
    classes: term.classes.map((c) => ({ ...c, id: null })),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function isSidebarCourse(id: string): boolean {
  return id.startsWith(SIDEBAR_COURSE_PREFIX);
}

export function flatTerms(schedule: Audit): AuditTerm[] {
  const terms: AuditTerm[] = [];
  for (const y of schedule.years) {
    terms.push(y.fall, y.spring, y.summer1, y.summer2);
  }
  return terms;
}

// ── Schedule Mutations ───────────────────────────────────────────────────────

/** Append a new empty year to the schedule. Returns the new schedule and the year number. */
export function addYear(schedule: Audit): {
  schedule: Audit;
  addedYear: number;
} {
  const addedYear = schedule.years.length + 1;
  const emptyTerm = (season: SeasonEnum): AuditTerm => ({
    season,
    status: StatusEnum.CLASSES,
    classes: [],
    id: `${addedYear}-${season}`,
  });
  const next = produce(schedule, (draft) => {
    draft.years.push({
      year: addedYear,
      fall: emptyTerm(SeasonEnum.FL),
      spring: emptyTerm(SeasonEnum.SP),
      summer1: emptyTerm(SeasonEnum.S1),
      summer2: emptyTerm(SeasonEnum.S2),
      isSummerFull: false,
    });
  });
  return { schedule: next, addedYear };
}

/** Delete the given year (1-indexed) and renumber remaining years. */
export function deleteYear(schedule: Audit, yearNum: number): Audit {
  return produce(schedule, (draft) => {
    const idx = yearNum - 1;
    if (idx >= draft.years.length) return;
    draft.years.splice(idx, 1);
    draft.years.forEach((y, i) => {
      y.year = i + 1;
    });
  });
}

/** Remove a single course at (year, season, courseIndex). */
export function removeCourse(
  schedule: Audit,
  yearNum: number,
  season: SeasonEnum,
  courseIndex: number,
): Audit {
  return produce(schedule, (draft) => {
    const year = draft.years.find((y) => y.year === yearNum);
    if (!year) return;
    const termMap: Record<string, AuditTerm> = {
      [SeasonEnum.FL]: year.fall,
      [SeasonEnum.SP]: year.spring,
      [SeasonEnum.S1]: year.summer1,
      [SeasonEnum.S2]: year.summer2,
    };
    const term = termMap[season];
    if (term) term.classes.splice(courseIndex, 1);
  });
}

// ── Collision Detection ──────────────────────────────────────────────────────

export const collisionAlgorithm: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};
