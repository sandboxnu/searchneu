import { db, coursesT, subjectsT } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { Requisite, RequisiteItem, Condition } from "@sneu/scraper/types";

/**
 * Type guards for Requisite items
 */
const isCondition = (item: RequisiteItem): item is Condition => {
  return "type" in item && "items" in item;
};

const isCourse = (
  item: RequisiteItem,
): item is { subject: string; courseNumber: string } => {
  return "subject" in item && "courseNumber" in item;
};

/**
 * Recursively extract all course references from a Requisite tree
 */
function extractCoursesFromRequisite(
  requisite: Requisite,
): Array<{ subject: string; courseNumber: string }> {
  const courses: Array<{ subject: string; courseNumber: string }> = [];

  if (Object.keys(requisite).length === 0) {
    return courses; // Empty requisite
  }

  const walk = (item: RequisiteItem) => {
    if (isCondition(item)) {
      item.items.forEach(walk);
    } else if (isCourse(item)) {
      courses.push({ subject: item.subject, courseNumber: item.courseNumber });
    }
    // Ignore Test items - they're not courses
  };

  // Cast to RequisiteItem since we've already checked it's not empty
  const item = requisite as RequisiteItem;

  if (isCondition(item)) {
    walk(item);
  } else if (isCourse(item)) {
    courses.push(item);
  }

  return courses;
}

/**
 * Resolve course references to their IDs in the database
 * Returns a Map of { subject + courseNumber } -> course ID
 */
async function resolveCourseReferences(
  courseRefs: Array<{ subject: string; courseNumber: string }>,
  termId: number,
): Promise<Map<string, number>> {
  if (courseRefs.length === 0) return new Map();

  const coreqCourses = await db
    .select({
      id: coursesT.id,
      subject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .where(eq(coursesT.termId, termId));

  const courseMap = new Map<string, number>();
  for (const course of coreqCourses) {
    const key = `${course.subject}:${course.courseNumber}`;
    courseMap.set(key, course.id);
  }

  // Map references to IDs
  const result = new Map<string, number>();
  for (const ref of courseRefs) {
    const key = `${ref.subject}:${ref.courseNumber}`;
    const id = courseMap.get(key);
    if (id) {
      result.set(key, id);
    }
  }

  return result;
}

/**
 * Get all corequisite course IDs for a given course
 * Returns an array of coreq course IDs in the same term
 */
export async function getCoreqCourseIds(courseId: number): Promise<number[]> {
  const course = await db
    .select({
      coreqs: coursesT.coreqs,
      termId: coursesT.termId,
    })
    .from(coursesT)
    .where(eq(coursesT.id, courseId))
    .limit(1);

  if (!course || course.length === 0) {
    return [];
  }

  const { coreqs, termId } = course[0];
  const courseRefs = extractCoursesFromRequisite(coreqs as Requisite);
  const coreqMap = await resolveCourseReferences(courseRefs, termId);

  return Array.from(coreqMap.values());
}

/**
 * Build corequisite groups from a list of course IDs
 * Only groups together coreqs that are BOTH in the input list.
 *
 * Constraint logic:
 * - If only 1 out of 2 coreqs is passed in → that 1 can stand alone
 * - If 2 out of 2 coreqs are passed in → both must be in the schedule
 * - If all N coreqs are passed in → all N must be in the schedule
 *
 * @example
 * If courseIds = [101, 102, 103] where 101 has coreqs [102], 102 has coreqs [101]
 * Returns [[101, 102], [103]]
 *
 * If courseIds = [101, 104] where 101 has coreqs [102], 102 has coreqs [101]
 * Returns [[101], [104]] (102 wasn't passed in, so 101 stands alone)
 */
export async function buildCoreqGroups(
  courseIds: number[],
): Promise<number[][]> {
  const coreqMap = new Map<number, Set<number>>();

  // Get all coreqs for each course, but only include those in the input list
  for (const courseId of courseIds) {
    const allCoreqs = await getCoreqCourseIds(courseId);
    // Filter to only include coreqs that are also in the input list
    const relevantCoreqs = allCoreqs.filter((c) => courseIds.includes(c));
    coreqMap.set(courseId, new Set(relevantCoreqs));
  }

  // Build groups: courses that are coreqs of each other (only considering passed-in courses)
  const visited = new Set<number>();
  const groups: number[][] = [];

  for (const courseId of courseIds) {
    if (visited.has(courseId)) continue;

    const group = [courseId];
    visited.add(courseId);

    // Find all courses in the coreq network
    const queue = [courseId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const coreqs = coreqMap.get(current) || new Set();

      for (const coreq of coreqs) {
        if (!visited.has(coreq)) {
          group.push(coreq);
          visited.add(coreq);
          queue.push(coreq);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}
