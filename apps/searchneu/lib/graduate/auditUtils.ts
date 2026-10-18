import {
  Audit,
  AuditCourse,
  AuditTerm,
  AuditYear,
  CourseDetails,
  SeasonEnum,
} from "./types";

// ── Shared Constants ────────────────────────────────────────────────────────

export const SEASON_DISPLAY: Record<string, string> = {
  [SeasonEnum.FL]: "Fall",
  [SeasonEnum.SP]: "Spring",
  [SeasonEnum.S1]: "Summer I",
  [SeasonEnum.S2]: "Summer II",
};

export const UNDECIDED_CONCENTRATION = "Concentration Undecided";

// ── Shared Helpers ──────────────────────────────────────────────────────────

export function courseToString(c: {
  subject: string;
  classId: string | number;
}): string {
  return `${c.subject}${c.classId}`;
}

/** Returns the term from a year for the given season. */
export function getTermFromYear(
  year: AuditYear,
  season: SeasonEnum,
): AuditTerm | undefined {
  switch (season) {
    case SeasonEnum.FL:
      return year.fall;
    case SeasonEnum.SP:
      return year.spring;
    case SeasonEnum.S1:
      return year.summer1;
    case SeasonEnum.S2:
      return year.summer2;
    default:
      return undefined;
  }
}

/** Returns all four terms of a year as an array. */
export function allTerms(year: AuditYear): AuditTerm[] {
  return [year.fall, year.spring, year.summer1, year.summer2];
}

/**
 * Fill in a course's credits, NUPaths, and requisites from its catalog
 * details. Returns the course unchanged if no details were found.
 */
export function applyCourseDetails(
  course: AuditCourse,
  details: CourseDetails | undefined,
): AuditCourse {
  if (!details) return course;
  return {
    ...course,
    numCreditsMin: details.minCredits,
    numCreditsMax: details.maxCredits,
    nupaths: details.nupaths,
    coreqs: details.coreqs,
    prereqs: details.prereqs,
  };
}

/**
 * Apply `applyCourseDetails` to every course in a schedule, and fill in
 * course names when `courseNames` is given. Both maps are keyed by
 * "SUBJECT-CLASSID".
 */
export function applyScheduleCourseDetails(
  schedule: Audit,
  courseDetails: Record<string, CourseDetails>,
  courseNames: Record<string, string> = {},
): Audit {
  const mapCourse = (c: AuditCourse): AuditCourse => {
    const key = `${c.subject}-${c.classId}`;
    return applyCourseDetails(
      { ...c, name: courseNames[key] ?? c.name },
      courseDetails[key],
    );
  };
  const mapTerm = (term: AuditTerm): AuditTerm => ({
    ...term,
    classes: term.classes.map(mapCourse),
  });
  return {
    years: (schedule.years ?? []).map((year) => ({
      ...year,
      fall: mapTerm(year.fall),
      spring: mapTerm(year.spring),
      summer1: mapTerm(year.summer1),
      summer2: mapTerm(year.summer2),
    })),
  };
}

/** Sum of minimum credits across all terms in an audit. */
export function creditsInAudit(audit: Audit): number {
  let sum = 0;
  for (const year of audit.years) {
    for (const term of allTerms(year)) {
      for (const course of term.classes) {
        sum += course.numCreditsMin;
      }
    }
  }
  return sum;
}
