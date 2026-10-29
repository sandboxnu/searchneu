import { SectionWithCourse } from "./filters";
import { type CourseGroup } from "./courseGroups";
import { combineSelections, extendWithOptional } from "./scheduleSearch";

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
  targetGroupCount?: number,
): SectionWithCourse[][] => {
  if (lockedGroups.length === 0 && optionalGroups.length === 0) return [];

  // A locked group that cannot be scheduled makes the plan impossible.
  if (lockedGroups.some((group) => group.options.length === 0)) return [];

  const lockedSelections = combineSelections(
    lockedGroups.map((group) => group.options),
  );

  // An optional group that cannot be scheduled just never gets taken.
  const optionalSlots = optionalGroups
    .filter((group) => group.options.length > 0)
    .map((group) => group.options);

  const optionalTarget =
    targetGroupCount === undefined
      ? undefined
      : targetGroupCount - lockedGroups.length;

  return lockedSelections
    .flatMap((locked) =>
      extendWithOptional(locked, optionalSlots, optionalTarget),
    )
    .map((selection) => selection.sections);
};
