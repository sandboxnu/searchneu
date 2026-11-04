import { db, coursesT, subjectsT } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { courseReferenceKey, extractCourseReferences } from "./coreqs";

/**
 * Partition course IDs into the groups that must be scheduled together.
 *
 * Two courses are grouped when one lists the other as a corequisite and both
 * were passed in. Ignoring coreqs the caller did not ask for is what lets a
 * student take a lecture without its optional lab.
 *
 * Grouping is symmetric and transitive, so this is a connected-components
 * walk. A course with no coreqs present comes back as a group of one, which
 * is why callers never special-case ungrouped courses.
 */
export async function resolveCoreqGroups(
  courseIds: number[],
): Promise<number[][]> {
  const uniqueIds = Array.from(new Set(courseIds));
  if (uniqueIds.length === 0) return [];
  if (uniqueIds.length === 1) return [[uniqueIds[0]]];

  const courses = await db
    .select({
      id: coursesT.id,
      subject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      coreqs: coursesT.coreqs,
    })
    .from(coursesT)
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .where(inArray(coursesT.id, uniqueIds));

  const idByReference = new Map<string, number>();
  for (const course of courses) {
    idByReference.set(courseReferenceKey(course), course.id);
  }

  const neighbours = new Map<number, Set<number>>();
  for (const id of uniqueIds) neighbours.set(id, new Set());

  for (const course of courses) {
    for (const reference of extractCourseReferences(course.coreqs)) {
      const coreqId = idByReference.get(courseReferenceKey(reference));
      if (coreqId === undefined || coreqId === course.id) continue;
      // Banner often declares the link on one side only, but the constraint
      // runs both ways.
      neighbours.get(course.id)!.add(coreqId);
      neighbours.get(coreqId)!.add(course.id);
    }
  }

  const groups: number[][] = [];
  const grouped = new Set<number>();

  // Walking uniqueIds rather than the query result keeps caller order, and
  // keeps a course with no catalog row as a group of one instead of dropping
  // it from the plan.
  for (const id of uniqueIds) {
    if (grouped.has(id)) continue;

    const group: number[] = [id];
    grouped.add(id);

    for (let i = 0; i < group.length; i++) {
      for (const neighbour of neighbours.get(group[i]) ?? []) {
        if (grouped.has(neighbour)) continue;
        grouped.add(neighbour);
        group.push(neighbour);
      }
    }

    groups.push(group);
  }

  return groups;
}
