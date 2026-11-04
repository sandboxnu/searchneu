import type { Requisite, RequisiteItem } from "@sneu/scraper/types";

/** A course as named inside a requisite tree, before it is matched to a row. */
export type CourseReference = {
  subject: string;
  courseNumber: string;
};

/** Courses are unique per term on (subject, courseNumber). */
export const courseReferenceKey = (ref: CourseReference): string =>
  `${ref.subject}:${ref.courseNumber}`;

const isCondition = (
  item: RequisiteItem,
): item is Extract<RequisiteItem, { items: RequisiteItem[] }> =>
  "items" in item && Array.isArray(item.items);

const isCourseReference = (item: RequisiteItem): item is CourseReference =>
  "subject" in item && "courseNumber" in item;

/**
 * Every course mentioned in a requisite tree.
 *
 * The and/or structure is flattened: the student picks which coreqs they want
 * in the modal, so this only has to recognise the ones they picked. Test
 * requisites are not courses and are skipped.
 */
export function extractCourseReferences(coreqs: unknown): CourseReference[] {
  const found: CourseReference[] = [];

  const walk = (item: RequisiteItem) => {
    if (isCondition(item)) {
      item.items.forEach(walk);
    } else if (isCourseReference(item)) {
      found.push({ subject: item.subject, courseNumber: item.courseNumber });
    }
  };

  // An absent requisite is stored as an empty object, not null.
  if (!coreqs || typeof coreqs !== "object") return found;
  if (Object.keys(coreqs).length === 0) return found;

  walk(coreqs as Exclude<Requisite, Record<never, never>>);
  return found;
}
