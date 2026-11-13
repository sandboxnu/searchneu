/**
 * Folds course detail already in the catalog back into a fresh snapshot,
 * which is what lets the daemon hold no state between passes.
 *
 * Only the courses scraped this pass are written, but postreqs invert the
 * whole term's prereqs, so every other course needs its stored ones.
 */

import type { TermSnapshot } from "../../schemas/scraper/snapshot";
import type { CourseRow, TermState } from "./state";

export function hydrate(
  snapshot: TermSnapshot,
  state: TermState,
): TermSnapshot {
  const rows = new Map<string, CourseRow>();
  for (const part of state.parts.values()) {
    for (const [register, row] of part.courses) {
      // a register can appear under several parts; first one wins
      if (!rows.has(register)) rows.set(register, row);
    }
  }

  if (rows.size === 0) return snapshot;

  const courses = snapshot.courses.map((course) => {
    const row = rows.get(course.subject + course.courseNumber);
    if (!row) return course;

    return {
      ...course,
      name: row.name,
      description: row.description,
      prereqs: row.prereqs as typeof course.prereqs,
      coreqs: row.coreqs as typeof course.coreqs,
    };
  });

  return { ...snapshot, courses };
}
