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
  Whiteboard,
  WhiteboardStatus,
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

/**
 * Map each "SUBJECT CLASSID" in a schedule to its credits. Used to evaluate
 * requirements, including "X credits from many" requirements that need to
 * know how many credits each course is worth.
 */
export function collectScheduleCourseCredits(
  schedule: Audit,
): Map<string, number> {
  const credits = new Map<string, number>();
  for (const c of collectScheduleCourses(schedule)) {
    credits.set(`${c.subject} ${c.classId}`, c.numCreditsMin);
  }
  return credits;
}

/** Schedule course keys that fall inside a RANGE requirement. */
function matchingRangeCourses(
  r: ICourseRange,
  scheduleCourses: Map<string, number>,
): string[] {
  const exceptions = new Set(
    r.exceptions.map((e) => `${e.subject} ${e.classId}`),
  );
  return [...scheduleCourses.keys()].filter((key) => {
    const [subject, classId] = key.split(" ");
    const id = parseInt(classId, 10);
    return (
      subject === r.subject &&
      id >= r.idRangeStart &&
      id <= r.idRangeEnd &&
      !exceptions.has(key)
    );
  });
}

/**
 * Check if a single requirement is fulfilled. `scheduleCourses` maps each
 * "SUBJECT CLASSID" in the schedule to its credits.
 */
export function isRequirementFulfilled(
  req: Requirement,
  scheduleCourses: Map<string, number>,
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
      return sumFulfilledCredits(r.courses, scheduleCourses) >= r.numCreditsMin;
    }
    case "RANGE": {
      const r = req as ICourseRange;
      return matchingRangeCourses(r, scheduleCourses).length > 0;
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

/** Total credits from the fulfilled requirements in a list. */
function sumFulfilledCredits(
  reqs: Requirement[],
  scheduleCourses: Map<string, number>,
): number {
  let total = 0;
  for (const req of reqs) {
    if (isRequirementFulfilled(req, scheduleCourses)) {
      total += getRequirementCredits(req, scheduleCourses);
    }
  }
  return total;
}

/** Credits the schedule earns toward a requirement (used for XOM counting). */
function getRequirementCredits(
  req: Requirement,
  scheduleCourses: Map<string, number>,
): number {
  switch (req.type) {
    case "COURSE": {
      const c = req as IRequiredCourse;
      return scheduleCourses.get(`${c.subject} ${c.classId}`) ?? 0;
    }
    case "OR": {
      // Only one option counts, so use the first one that is fulfilled
      const r = req as IOrCourse;
      const taken = r.courses.find((c) =>
        isRequirementFulfilled(c, scheduleCourses),
      );
      return taken ? getRequirementCredits(taken, scheduleCourses) : 0;
    }
    case "RANGE": {
      const r = req as ICourseRange;
      return matchingRangeCourses(r, scheduleCourses).reduce(
        (sum, key) => sum + (scheduleCourses.get(key) ?? 0),
        0,
      );
    }
    case "AND":
    case "XOM":
      return sumFulfilledCredits(
        (req as IAndCourse | IXofManyCourse).courses,
        scheduleCourses,
      );
    case "SECTION":
      return sumFulfilledCredits(
        (req as Section).requirements,
        scheduleCourses,
      );
    default:
      return 0;
  }
}

/** Count fulfilled vs total requirements for a section. */
export function sectionCompletion(
  section: Section,
  scheduleCourses: Map<string, number>,
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
  scheduleCourses: Map<string, number>,
): boolean {
  const { fulfilled } = sectionCompletion(section, scheduleCourses);
  return fulfilled >= section.minRequirementCount;
}

/** Recursively collect all "SUBJECT CLASSID" keys from required courses in a requirement tree. */
export function collectRequiredCourseKeys(req: Requirement): string[] {
  if (req.type === "COURSE") {
    return [`${req.subject} ${req.classId}`];
  }
  if (
    req.type === "AND" ||
    req.type === "OR" ||
    req.type === "XOM" ||
    req.type === "SECTION"
  ) {
    const children =
      req.type === "SECTION"
        ? (req as Section).requirements
        : (req as IAndCourse | IOrCourse | IXofManyCourse).courses;
    return (children as Requirement[]).flatMap(collectRequiredCourseKeys);
  }
  return [];
}

/**
 * Collects all of the "SUBJECT-CLASSID" keys from a list of requirements
 * into `out` so you can batch-fetch course names for the requirement sections
 */
export function collectCourseKeys(reqs: Requirement[], out: Set<string>): void {
  for (const req of reqs) {
    if (req.type === "COURSE") {
      out.add(`${req.subject}-${req.classId}`);
    } else if (req.type === "AND" || req.type === "OR" || req.type === "XOM") {
      collectCourseKeys(req.courses, out);
    } else if (req.type === "SECTION") {
      collectCourseKeys(req.requirements, out);
    }
  }
}

/**
 * Build a whiteboard by matching schedule courses against each section's
 * requirements. If `current` is provided, manual entries are preserved and
 * "not_started" auto-upgrades to "in_progress" once a match exists.
 */
export function buildWhiteboardFromSchedule(
  sections: Section[],
  schedule: Audit,
  current: Whiteboard = {},
): Whiteboard {
  const scheduleKeys = collectScheduleCourseKeys(schedule);
  const updated: Whiteboard = { ...current };

  for (const section of sections) {
    const sectionKeys = new Set<string>();
    for (const req of section.requirements) {
      for (const key of collectRequiredCourseKeys(req)) {
        sectionKeys.add(key);
      }
    }
    const matched = [...sectionKeys].filter((k) => scheduleKeys.has(k));
    const existingCourses = current[section.title]?.courses ?? [];
    const merged = [...new Set([...existingCourses, ...matched])];
    const existingStatus = current[section.title]?.status;

    let status: WhiteboardStatus;
    if (merged.length > 0) {
      status =
        (existingStatus ?? "not_started") === "not_started"
          ? "in_progress"
          : (existingStatus ?? "in_progress");
    } else {
      status = existingStatus ?? "not_started";
    }

    updated[section.title] = { courses: merged, status };
  }
  return updated;
}

/** Remove whiteboard course entries that no longer exist in the schedule. */
export function pruneWhiteboard(
  schedule: Audit,
  wb: Whiteboard,
): Whiteboard | null {
  const valid = collectScheduleCourseKeys(schedule);
  let changed = false;
  const pruned: Whiteboard = {};
  for (const [section, entry] of Object.entries(wb)) {
    const filtered = entry.courses.filter((k) => valid.has(k));
    if (filtered.length !== entry.courses.length) changed = true;
    pruned[section] = { ...entry, courses: filtered };
  }
  return changed ? pruned : null;
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
