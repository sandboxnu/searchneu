import type { Plan, PlanCourse, PlanTerm, PlanYear } from "./types";
import { SeasonEnum } from "./types";

const DEFAULT_YEARS = 4;
const SEASONS_PER_YEAR: SeasonEnum[] = [SeasonEnum.FL, SeasonEnum.SP];

function createEmptyTerm(year: number, season: SeasonEnum): PlanTerm {
  return {
    id: `${year}-${season}`,
    season,
    classes: [],
  };
}

function createEmptyYear(year: number): PlanYear {
  return {
    year,
    fall: createEmptyTerm(year, SeasonEnum.FL),
    spring: createEmptyTerm(year, SeasonEnum.SP),
  };
}

/** Creates a plan with 4 years, each with empty Fall and Spring terms. */
export function createEmptyPlan(numYears = DEFAULT_YEARS): Plan {
  const years: PlanYear[] = [];
  for (let y = 1; y <= numYears; y++) {
    years.push(createEmptyYear(y));
  }
  return { schedule: { years } };
}

/** Flattens schedule to a list of terms for lookups. */
export function flattenScheduleToTerms(plan: Plan): PlanTerm[] {
  const terms: PlanTerm[] = [];
  for (const year of plan.schedule.years) {
    terms.push(year.fall, year.spring);
  }
  return terms;
}

/** Get display label for a season. */
export function getSeasonDisplayWord(season: SeasonEnum): string {
  switch (season) {
    case SeasonEnum.FL:
      return "Fall";
    case SeasonEnum.SP:
      return "Spring";
    case SeasonEnum.S1:
      return "Summer 1";
    case SeasonEnum.S2:
      return "Summer 2";
    case SeasonEnum.SM:
      return "Summer Full";
    default:
      return String(season);
  }
}

/** Check if a course (by subject + classId) is already in a term. */
export function isCourseInTerm(
  subject: string,
  classId: string,
  term: PlanTerm
): boolean {
  return term.classes.some(
    (c) => c.subject === subject && c.classId === String(classId)
  );
}

/** Id prefix used for sidebar course drag sources (so we can detect origin). */
export const SIDEBAR_COURSE_DND_PREFIX = "sidebar-";

export function isCourseFromSidebar(dndId: string): boolean {
  return String(dndId).startsWith(SIDEBAR_COURSE_DND_PREFIX);
}

/** Payload from drag event when dropping a course onto a term. */
export interface DropResult {
  course: PlanCourse;
  overTermId: string;
}

/**
 * Adds a course to a term in the plan. Returns a new plan (immutable).
 * If the course is already in the term, returns the same plan.
 */
export function addCourseToTerm(
  plan: Plan,
  termId: string,
  course: PlanCourse
): Plan {
  const terms = flattenScheduleToTerms(plan);
  const term = terms.find((t) => t.id === termId);
  if (!term) return plan;
  if (isCourseInTerm(course.subject, course.classId, term)) return plan;

  const newPlan: Plan = {
    schedule: {
      years: plan.schedule.years.map((y) => ({
        year: y.year,
        fall:
          y.fall.id === termId
            ? { ...y.fall, classes: [...y.fall.classes, { ...course }] }
            : y.fall,
        spring:
          y.spring.id === termId
            ? { ...y.spring, classes: [...y.spring.classes, { ...course }] }
            : y.spring,
      })),
    },
  };
  return newPlan;
}

export function removeCourseFromTerm(
  plan: Plan,
  termId: string,
  courseId: string
): Plan {
  return {
    schedule: {
      years: plan.schedule.years.map((y) => ({
        year: y.year,
        fall:
          y.fall.id === termId
            ? { ...y.fall, classes: y.fall.classes.filter((c) => c.id !== courseId) }
            : y.fall,
        spring:
          y.spring.id === termId
            ? { ...y.spring, classes: y.spring.classes.filter((c) => c.id !== courseId) }
            : y.spring,
      })),
    },
  };
}
