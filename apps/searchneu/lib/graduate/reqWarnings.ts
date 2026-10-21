import type { Requisite } from "@sneu/scraper/types";
import {
  Audit,
  AuditTerm,
  CoReqWarnings,
  INEUReqError,
  PreReqWarnings,
  ReqErrorType,
  YearError,
} from "./types";

/** The term fields of an AuditYear, in the order they happen. */
const TERM_KEYS = ["fall", "spring", "summer1", "summer2"] as const;

/** Key used to compare courses and to index a TermError, e.g. "CS 2510". */
function courseKey(subject: string, id: string): string {
  return `${subject} ${id}`;
}

/**
 * Years sorted by academic year (not array order). Summer full needs no
 * special case: its classes live in summer1.
 */
function yearsInOrder(schedule: Audit) {
  return [...schedule.years].sort((a, b) => a.year - b.year);
}

/** One YearError per year with every term empty, so lookups never miss. */
function emptyYearErrors(schedule: Audit): YearError[] {
  return yearsInOrder(schedule).map((year) => ({
    year: year.year,
    fall: {},
    spring: {},
    summer1: {},
    summer2: {},
  }));
}

/** Keys of every overridden course; these count as already taken. */
function overrideKeys(schedule: Audit): Set<string> {
  const keys = new Set<string>();
  for (const course of schedule.overrides ?? []) {
    keys.add(courseKey(course.subject, course.classId));
  }
  return keys;
}

/** Add every course in a term to the given set of course keys. */
function addTermCourses(term: AuditTerm, keys: Set<string>): void {
  for (const course of term.classes) {
    keys.add(courseKey(course.subject, course.classId));
  }
}

/**
 * The fewest courses needed to clear an error: all of an `and`, but only the
 * cheapest branch of an `or`.
 */
function coursesNeeded(error: INEUReqError): number {
  switch (error.type) {
    case ReqErrorType.COURSE:
      return 1;
    case ReqErrorType.AND:
      return error.missing.reduce((sum, e) => sum + coursesNeeded(e), 0);
    case ReqErrorType.OR:
      return Math.min(...error.missing.map(coursesNeeded));
  }
}

/**
 * Combine child errors of an and/or into one error. Same-type children are
 * flattened and a single error is returned as-is, so the tooltip never shows
 * a wrapper around one course. `or` branches are sorted easiest-first.
 */
function combine(
  type: ReqErrorType.AND | ReqErrorType.OR,
  errors: INEUReqError[],
): INEUReqError {
  const missing = errors.flatMap((e) => (e.type === type ? e.missing : [e]));
  if (missing.length === 1) return missing[0];
  if (type === ReqErrorType.OR) {
    missing.sort((a, b) => coursesNeeded(a) - coursesNeeded(b));
  }
  return { type, missing };
}

/**
 * Check a requisite against a set of taken course keys. Returns undefined
 * when satisfied, otherwise an error listing only the missing pieces.
 *
 * - `{}`, a missing requisite, or an empty and/or is satisfied.
 * - Exams (AP/IB etc.) count as satisfied; plans don't track them yet.
 * - An `and` reports only its unmet children. An `or` fails only when every
 *   branch does, and then lists every branch ("one of"), easiest first.
 */
function checkReq(
  req: Requisite | undefined,
  taken: Set<string>,
): INEUReqError | undefined {
  if (!req || typeof req !== "object") return undefined;

  if ("subject" in req && "courseNumber" in req) {
    if (taken.has(courseKey(req.subject, req.courseNumber))) return undefined;
    return {
      type: ReqErrorType.COURSE,
      subject: req.subject,
      classId: req.courseNumber,
    };
  }

  if ("type" in req && "items" in req) {
    const errors: INEUReqError[] = [];
    for (const item of req.items) {
      const error = checkReq(item, taken);
      if (error) {
        errors.push(error);
      } else if (req.type === "or") {
        // One satisfied branch is enough for an or
        return undefined;
      }
    }
    if (errors.length === 0) return undefined;
    return combine(
      req.type === "and" ? ReqErrorType.AND : ReqErrorType.OR,
      errors,
    );
  }

  // Exam ({ name, score }) or {}
  return undefined;
}

/**
 * Find courses scheduled before their prereqs. A prereq is met only by a
 * course in an earlier term (or an override); the same term doesn't count.
 */
export function getPrereqWarnings(schedule: Audit): PreReqWarnings {
  const years = emptyYearErrors(schedule);
  const taken = overrideKeys(schedule);

  yearsInOrder(schedule).forEach((year, i) => {
    for (const termKey of TERM_KEYS) {
      const term = year[termKey];
      for (const course of term.classes) {
        const error = checkReq(course.prereqs, taken);
        if (error) {
          years[i][termKey][courseKey(course.subject, course.classId)] = error;
        }
      }
      // Add this term's courses only after checking, so courses in the same
      // term can't satisfy each other's prereqs
      addTermCourses(term, taken);
    }
  });

  return { type: "prereq", years };
}

/**
 * Find courses scheduled without their coreqs. A coreq is met by a course in
 * the same term (or an override).
 */
export function getCoreqWarnings(schedule: Audit): CoReqWarnings {
  const years = emptyYearErrors(schedule);

  yearsInOrder(schedule).forEach((year, i) => {
    for (const termKey of TERM_KEYS) {
      const term = year[termKey];
      const inTerm = overrideKeys(schedule);
      addTermCourses(term, inTerm);

      for (const course of term.classes) {
        const error = checkReq(course.coreqs, inTerm);
        if (error) {
          years[i][termKey][courseKey(course.subject, course.classId)] = error;
        }
      }
    }
  });

  return { type: "coreq", years };
}
