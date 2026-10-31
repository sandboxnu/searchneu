import { SectionWithCourse } from "./filters";
import { meetingTimesToBinaryMask } from "./binaryMeetingTime";
import { combineSelections, type MaskedSelection } from "./scheduleSearch";

/**
 * Courses that must be scheduled together, and every way of doing so without
 * an internal conflict.
 *
 * Collapsing a group to a list of options is what makes the rest of
 * generation group-blind: a group is just a thing you pick one option from,
 * which is all a single course ever was.
 */
export type CourseGroup = {
  courseIds: number[];
  options: MaskedSelection[];
};

/**
 * A group whose courses can never fit together comes back with no options.
 * That is not an error here — the caller decides what an unschedulable group
 * means.
 */
export const buildCourseGroups = (
  groupings: number[][],
  sectionsByCourseId: Map<number, SectionWithCourse[]>,
): CourseGroup[] =>
  groupings.map((courseIds) => {
    const perCourse = courseIds.map((courseId) =>
      (sectionsByCourseId.get(courseId) ?? []).map((section) => ({
        sections: [section],
        mask: meetingTimesToBinaryMask(section),
      })),
    );

    return { courseIds, options: combineSelections(perCourse) };
  });
