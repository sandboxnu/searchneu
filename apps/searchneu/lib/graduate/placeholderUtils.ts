import { AuditCourse, NUPathEnum } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Subject used for every placeholder course. It is not a real Northeastern
 * subject, so placeholders never match a catalog course or a major/minor
 * requirement.
 */
export const PLACEHOLDER_SUBJECT = "PLACEHOLDER";

export const DEFAULT_PLACEHOLDER_CREDITS = 4;

/** Credit amounts a student can pick for a placeholder. */
export const PLACEHOLDER_CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Ready-made elective placeholders shown in the sidebar. */
export const ELECTIVE_PLACEHOLDERS = ["General Elective", "Major Elective"];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a placeholder course: a stand-in for a class the student has not
 * picked yet. Placeholders count toward total credits, and toward a NUPath
 * when one is given, but never toward major or minor requirements.
 *
 * They are marked `generic`, so a term can hold more than one of them.
 */
export function createPlaceholderCourse({
  name,
  credits,
  nupath,
}: {
  name: string;
  credits: number;
  nupath?: string;
}): AuditCourse {
  return {
    name,
    subject: PLACEHOLDER_SUBJECT,
    classId: nupath ?? "ELECTIVE",
    // Catalog courses store NUPaths as short codes ("WI", "ND", ...)
    nupaths: nupath ? [nupath as NUPathEnum] : [],
    numCreditsMin: credits,
    numCreditsMax: credits,
    id: null,
    generic: true,
  };
}

export function isPlaceholderCourse(course: AuditCourse): boolean {
  return course.generic === true && course.subject === PLACEHOLDER_SUBJECT;
}
