import { Active, Over } from "@dnd-kit/core";
import {
  Audit,
  AuditCourse,
  AuditTerm,
  AuditYear,
  IRequiredCourse,
  SeasonEnum,
} from "../../../lib/graduate/types";
import { produce } from "immer";
import { isSidebarCourse } from "./AuditCourse";

// ── Constants ────────────────────────────────────────────────────────────────

export const SIDEBAR_DND_ID_PREFIX = "sidebar";
export const SIDEBAR_COURSE_DND_PREFIX = "sidebar-";
export const DELETE_COURSE_AREA_DND_ID = "delete-course-area";

const SEASON_DISPLAY: Record<string, string> = {
  [SeasonEnum.FL]: "Fall",
  [SeasonEnum.SP]: "Spring",
  [SeasonEnum.S1]: "Summer I",
  [SeasonEnum.S2]: "Summer II",
};

// ── Custom Error ─────────────────────────────────────────────────────────────

export class DuplicateCourseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateCourseError";
  }
}

// ── Private Helpers ──────────────────────────────────────────────────────────

function isCourseInTerm(
  classId: string,
  subject: string,
  term: AuditTerm<unknown>,
): boolean {
  return term.classes.some(
    (c) => c.classId === classId && c.subject === subject,
  );
}

function getSeasonDisplayWord(season: SeasonEnum): string {
  const word = SEASON_DISPLAY[season];
  if (!word) throw new Error(`Unknown season: ${season}`);
  return word;
}

// ── Flatten Helper ───────────────────────────────────────────────────────────

export const flattenScheduleToTerms = <T>(
  schedule: Audit<T>,
): AuditTerm<T>[] => {
  const terms: AuditTerm<T>[] = [];
  schedule.years.forEach((year) =>
    terms.push(year.fall, year.spring, year.summer1, year.summer2),
  );
  return terms;
};

// ── Prepare Plan for DnD ─────────────────────────────────────────────────────

export const prepareClassesForDnd = (
  classes: AuditCourse<null>[],
  courseCount: number,
  dndIdPrefix?: string,
): { dndClasses: AuditCourse<string>[]; updatedCount: number } => {
  let updatedCount = courseCount;
  const dndClasses = classes.map((course) => {
    updatedCount++;
    const dndIdSuffix = `${course.classId}-${course.subject}-${updatedCount}`;
    const dndId = dndIdPrefix ? `${dndIdPrefix}-${dndIdSuffix}` : dndIdSuffix;
    return { ...course, id: dndId };
  });
  return { dndClasses, updatedCount };
};

const prepareTermForDnd = (
  term: AuditTerm<null>,
  courseCount: number,
  yearNumber: number,
): { dndTerm: AuditTerm<string>; updatedCount: number } => {
  const { dndClasses, updatedCount } = prepareClassesForDnd(
    term.classes,
    courseCount,
  );
  return {
    dndTerm: {
      ...term,
      id: `${yearNumber}-${term.season}`,
      classes: dndClasses,
    },
    updatedCount,
  };
};

const prepareYearForDnd = (
  year: AuditYear<null>,
  courseCount: number,
): { updatedYear: AuditYear<string>; updatedCount: number } => {
  let updatedCount = courseCount;
  let res;

  res = prepareTermForDnd(year.fall, updatedCount, year.year);
  const fall = res.dndTerm;
  updatedCount = res.updatedCount;

  res = prepareTermForDnd(year.spring, updatedCount, year.year);
  const spring = res.dndTerm;
  updatedCount = res.updatedCount;

  res = prepareTermForDnd(year.summer1, updatedCount, year.year);
  const summer1 = res.dndTerm;
  updatedCount = res.updatedCount;

  res = prepareTermForDnd(year.summer2, updatedCount, year.year);
  const summer2 = res.dndTerm;
  updatedCount = res.updatedCount;

  return {
    updatedCount,
    updatedYear: { ...year, fall, spring, summer1, summer2 },
  };
};

export const preparePlanForDnd = (plan: Audit<null>): Audit<string> => {
  let courseCount = 0;
  const dndYears: AuditYear<string>[] = [];
  if (!plan.years) {
    console.log("DENNIS NO PLAN YEARS", plan);
  }

  plan.years.forEach((year) => {
    const { updatedCount, updatedYear } = prepareYearForDnd(year, courseCount);
    courseCount = updatedCount;
    dndYears.push(updatedYear);
  });

  return { years: dndYears };
};

export const getCourseCount = (plan: Audit<unknown>): number => {
  return plan.years.reduce(
    (count, year) =>
      count +
      year.fall.classes.length +
      year.spring.classes.length +
      year.summer1.classes.length +
      year.summer2.classes.length,
    0,
  );
};

export function requiredCourseToAuditCourse(
  c: IRequiredCourse,
  dndId: string,
): AuditCourse<string> {
  return {
    id: dndId,
    subject: c.subject,
    classId: String(c.classId),
    name: c.description ?? `${c.subject} ${c.classId}`,
    numCreditsMin: 0,
    numCreditsMax: 0,
  };
}

// ── Clean DnD IDs ────────────────────────────────────────────────────────────

const cleanDndIdsFromTerm = (term: AuditTerm<string>): AuditTerm<null> => ({
  ...term,
  id: null,
  classes: term.classes.map((course) => ({ ...course, id: null })),
});

export const cleanDndIdsFromPlan = (plan: Audit<string>): Audit<null> => ({
  ...plan,
  years: plan.years.map((year) => ({
    ...year,
    fall: cleanDndIdsFromTerm(year.fall),
    spring: cleanDndIdsFromTerm(year.spring),
    summer1: cleanDndIdsFromTerm(year.summer1),
    summer2: cleanDndIdsFromTerm(year.summer2),
  })),
});

// ── Drop Handler ─────────────────────────────────────────────────────────────

/**
 * Updates the plan when a course is dropped. Handles three cases:
 * 1. Sidebar course dropped on a term (add)
 * 2. Term course dropped on a different term (move)
 * 3. Course dropped on the delete area (remove)
 *
 * Throws DuplicateCourseError if a non-generic course already exists in the
 * target term -- the caller should catch this and display the message.
 * Throws a plain Error for no-op drags (same term, invalid target, etc.).
 */
export const updatePlanOnDragEnd = (
  plan: Audit<string>,
  draggedCourse: Active,
  draggedOverTerm: Over | null = null,
): Audit<string> => {
  return produce(plan, (draftPlan: Audit<string>) => {
    const scheduleTerms = flattenScheduleToTerms<string>(draftPlan);

    const oldTerm = scheduleTerms.find((term) =>
      term.classes.some((course) => course.id === draggedCourse.id),
    );

    if (!draggedOverTerm) {
      throw new Error("Course is being dragged over nothing");
    }

    if (draggedOverTerm.id === DELETE_COURSE_AREA_DND_ID) {
      if (!oldTerm) {
        throw new Error("Term the course is dragged from isn't found");
      }
      oldTerm.classes = oldTerm.classes.filter(
        (course) => course.id !== draggedCourse.id,
      );
      return;
    }

    const newTerm = scheduleTerms.find(
      (term) => term.id === draggedOverTerm.id,
    );
    if (!newTerm) {
      throw new Error("Term the course is dragged over isn't found");
    }

    const year = plan.years.find((y) =>
      Object.values(y).find(
        (val) =>
          val &&
          typeof val === "object" &&
          "id" in val &&
          val.id === newTerm.id,
      ),
    );
    if (!year) {
      throw new Error("Year of the course that is dragged over isn't found");
    }

    const draggedCourseDetails: AuditCourse<unknown> | undefined =
      draggedCourse.data.current?.course;
    if (!draggedCourseDetails) {
      throw new Error("The dragged course data is missing");
    }

    const isFromSidebar = isSidebarCourse(draggedCourse.id as string);
    const isSameTerm = !isFromSidebar && oldTerm && oldTerm.id === newTerm.id;

    if (
      isCourseInTerm(
        draggedCourseDetails.classId,
        draggedCourseDetails.subject,
        newTerm,
      ) &&
      !isSameTerm &&
      !draggedCourseDetails.generic
    ) {
      throw new DuplicateCourseError(
        `${draggedCourseDetails.subject}${draggedCourseDetails.classId} already exists in Year ${year.year}, ${getSeasonDisplayWord(newTerm.season)}.`,
      );
    }

    if (!isFromSidebar) {
      if (!oldTerm) {
        throw new Error("Term the course is dragged from isn't found");
      }
      if (isSameTerm) {
        throw new Error("Course is being dragged over its own term");
      }
      oldTerm.classes = oldTerm.classes.filter(
        (course) => course.id !== draggedCourse.id,
      );
    }

    newTerm.classes.push({
      ...draggedCourse.data.current!.course,
      id: "moving-course-temp",
    });
  });
};
