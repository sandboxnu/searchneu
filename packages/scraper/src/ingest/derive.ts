/**
 * Step 6 - everything computable from the snapshot once detail has landed.
 * Pure and idempotent.
 */

import type { Requisite } from "../types";
import type { SnapshotCourse, TermSnapshot } from "../schemas/scraper/snapshot";

const SPECIAL_TOPICS = "Special Topics";

export function derive(snapshot: TermSnapshot): TermSnapshot {
  const courses = snapshot.courses.map((course) => ({
    ...course,
    specialTopics: course.specialTopics || course.name.includes(SPECIAL_TOPICS),
  }));

  return { ...snapshot, courses: withPostreqs(courses) };
}

/**
 * Inverts prerequisites across the term: A requires B makes A a postreq of B.
 * Only as complete as the prereqs that have been read so far.
 */
function withPostreqs(courses: SnapshotCourse[]): SnapshotCourse[] {
  const postreqs = new Map<string, Set<string>>();

  for (const course of courses) {
    const key = `${course.subject} ${course.courseNumber}`;
    for (const prereq of leafCourses(course.prereqs)) {
      const existing = postreqs.get(prereq);
      if (existing) existing.add(key);
      else postreqs.set(prereq, new Set([key]));
    }
  }

  return courses.map((course) => {
    const reqs = postreqs.get(`${course.subject} ${course.courseNumber}`);
    if (!reqs?.size) return { ...course, postreqs: {} };

    return {
      ...course,
      postreqs: {
        type: "and" as const,
        items: [...reqs].map((key) => {
          const [subject, courseNumber] = key.split(" ");
          return { subject, courseNumber };
        }),
      },
    };
  });
}

function leafCourses(req: Requisite): string[] {
  const found = new Set<string>();

  const visit = (node: Requisite) => {
    if (!node) return;
    if ("subject" in node && "courseNumber" in node) {
      found.add(`${node.subject} ${node.courseNumber}`);
      return;
    }
    if ("items" in node) node.items.forEach(visit);
  };

  visit(req);
  return [...found];
}
