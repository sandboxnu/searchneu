import {
  Audit,
  AuditCourse,
  Requirement,
  Section,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  IRequiredCourse,
  NUPathEnum,
} from "./types";

/** Collect all "SUBJECT CLASSID" keys present in a schedule. */
export function collectScheduleCourseKeys(schedule: Audit): Set<string> {
  const keys = new Set<string>();
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes) {
        keys.add(`${c.subject} ${c.classId}`);
      }
    }
  }
  return keys;
}

/** Collect all AuditCourse objects from a schedule. */
export function collectScheduleCourses(schedule: Audit): AuditCourse[] {
  const seen = new Set<string>();
  const courses: AuditCourse[] = [];
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes) {
        const key = `${c.subject} ${c.classId}`;
        if (!seen.has(key)) {
          seen.add(key);
          courses.push(c);
        }
      }
    }
  }
  return courses;
}

/** Check if a single requirement is fulfilled given schedule course keys. */
export function isRequirementFulfilled(
  req: Requirement,
  scheduleCourses: Set<string>,
): boolean {
  switch (req.type) {
    case "COURSE": {
      const c = req as IRequiredCourse;
      return scheduleCourses.has(`${c.subject} ${c.classId}`);
    }
    case "AND": {
      const r = req as IAndCourse;
      return r.courses.every((c) => isRequirementFulfilled(c, scheduleCourses));
    }
    case "OR": {
      const r = req as IOrCourse;
      return r.courses.some((c) => isRequirementFulfilled(c, scheduleCourses));
    }
    case "XOM": {
      const r = req as IXofManyCourse;
      let credits = 0;
      for (const c of r.courses) {
        if (isRequirementFulfilled(c, scheduleCourses)) {
          credits += getRequirementCredits(c, scheduleCourses);
        }
      }
      return credits >= r.numCreditsMin;
    }
    case "RANGE": {
      const r = req as ICourseRange;
      const exceptions = new Set(
        r.exceptions.map((e) => `${e.subject} ${e.classId}`),
      );
      for (const key of scheduleCourses) {
        const [subject, classId] = key.split(" ");
        const id = parseInt(classId, 10);
        if (
          subject === r.subject &&
          id >= r.idRangeStart &&
          id <= r.idRangeEnd &&
          !exceptions.has(key)
        ) {
          return true;
        }
      }
      return false;
    }
    case "SECTION": {
      const s = req as Section;
      const { fulfilled } = sectionCompletion(s, scheduleCourses);
      return fulfilled >= s.minRequirementCount;
    }
    default:
      return false;
  }
}

/** Estimate credits for a fulfilled requirement (used for XOM counting). */
function getRequirementCredits(
  req: Requirement,
  scheduleCourses: Set<string>,
): number {
  if (req.type === "COURSE") {
    // Default to 4 credits per course if we can't determine
    return 4;
  }
  if (req.type === "AND") {
    const r = req as IAndCourse;
    let total = 0;
    for (const c of r.courses) {
      if (isRequirementFulfilled(c, scheduleCourses)) {
        total += getRequirementCredits(c, scheduleCourses);
      }
    }
    return total;
  }
  return 4;
}

/** Count fulfilled vs total requirements for a section. */
export function sectionCompletion(
  section: Section,
  scheduleCourses: Set<string>,
): { fulfilled: number; total: number } {
  let fulfilled = 0;
  for (const req of section.requirements) {
    if (isRequirementFulfilled(req, scheduleCourses)) {
      fulfilled++;
    }
  }
  return {
    fulfilled,
    total: section.requirements.length,
  };
}

/** Check if a section is fully completed. */
export function isSectionComplete(
  section: Section,
  scheduleCourses: Set<string>,
): boolean {
  const { fulfilled } = sectionCompletion(section, scheduleCourses);
  return fulfilled >= section.minRequirementCount;
}

/** Collect all NUPath short codes fulfilled by courses in the schedule. */
export function collectFulfilledNupaths(schedule: Audit): Set<string> {
  const fulfilled = new Set<string>();
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const course of term.classes) {
        if (course.nupaths) {
          for (const np of course.nupaths) {
            fulfilled.add(np);
          }
        }
      }
    }
  }
  return fulfilled;
}

/** Display names for NUPath codes, matching the Figma designs. */
export const NUPATH_DISPLAY: Record<string, string> = {
  ND: "Natural and Designed World",
  EI: "Creative Expression/Innovation",
  IC: "Interpreting Culture",
  FQ: "Formal and Quantitative Reasoning",
  SI: "Societies/Institutions",
  AD: "Analyzing/Using Data",
  DD: "Difference and Diversity",
  ER: "Ethical Reasoning",
  WF: "First Year Writing",
  WI: "Writing Intensive",
  WD: "Advanced Writing in the Disciplines",
  EX: "Integration Experience",
  CE: "Capstone Experience",
};

/** All NUPath codes in display order. */
export const NUPATH_CODES = Object.keys(NUPATH_DISPLAY);
