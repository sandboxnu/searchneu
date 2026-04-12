import {
  CollisionDetection,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
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

// ── Collision Detection ──────────────────────────────────────────────────────

export const collisionAlgorithm: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};
