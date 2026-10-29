import { SectionWithCourse } from "./filters";
import { type CourseGroup } from "./courseGroups";
import { combineSelections, extendWithOptional } from "./scheduleSearch";

/**
 * Backstop, not a page size. Filters keep a narrowed plan nowhere near this;
 * an unfiltered six-of-ten plan can produce millions, which no browser holds.
 */
export const MAX_SCHEDULES = 1_000_000;

export type GenerateOptions = {
  targetGroupCount?: number;
  maxSchedules?: number;
  /** For requirements that can only be judged whole, such as NUPaths. */
  accept?: (sections: SectionWithCourse[]) => boolean;
};

/**
 * Every schedule satisfying the locked groups and the requested group count.
 *
 * The unit is a group, not a course: a lecture and its lab are taken together
 * and count once. Groups arrive already collapsed into options, so nothing
 * here knows whether a group holds one course or three.
 *
 * Pure and synchronous, which is what keeps it testable without a database.
 */
export const generateSchedules = (
  lockedGroups: CourseGroup[],
  optionalGroups: CourseGroup[],
  options: GenerateOptions = {},
): SectionWithCourse[][] => {
  const { targetGroupCount, accept } = options;
  const maxSchedules = options.maxSchedules ?? MAX_SCHEDULES;

  if (maxSchedules <= 0) return [];
  if (lockedGroups.length === 0 && optionalGroups.length === 0) return [];

  // A locked group that cannot be scheduled makes the plan impossible.
  if (lockedGroups.some((group) => group.options.length === 0)) return [];

  // Each locked selection yields at least one schedule, so building more than
  // the budget can use is wasted.
  const lockedSelections = combineSelections(
    lockedGroups.map((group) => group.options),
    maxSchedules,
  );

  // An optional group that cannot be scheduled just never gets taken.
  const optionalSlots = optionalGroups
    .filter((group) => group.options.length > 0)
    .map((group) => group.options);

  const optionalTarget =
    targetGroupCount === undefined
      ? undefined
      : targetGroupCount - lockedGroups.length;

  const schedules: SectionWithCourse[][] = [];

  for (const locked of lockedSelections) {
    const remaining = maxSchedules - schedules.length;
    if (remaining <= 0) break;

    for (const selection of extendWithOptional(
      locked,
      optionalSlots,
      optionalTarget,
      remaining,
      accept,
    )) {
      schedules.push(selection.sections);
    }
  }

  return schedules;
};
