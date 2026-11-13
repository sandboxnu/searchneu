/** Step 5 - folds course scrapes into the snapshot. */

import type { TermSnapshot } from "../../schemas/scraper/snapshot";
import type { CourseScrape, ExecuteResult } from "./execute";

export function applyScrapes(
  snapshot: TermSnapshot,
  result: ExecuteResult,
): TermSnapshot {
  const scrapes = new Map<string, CourseScrape>(
    result.courses.map((scrape) => [scrape.register, scrape]),
  );

  const courses = snapshot.courses.map((course) => {
    const scrape = scrapes.get(course.subject + course.courseNumber);
    if (!scrape) return course;

    return {
      ...course,
      name: scrape.name,
      description: scrape.description,
      prereqs: scrape.prereqs,
      coreqs: scrape.coreqs,
    };
  });

  const sections = Object.fromEntries(
    Object.entries(snapshot.sections).map(([register, list]) => {
      const scrape = scrapes.get(register);
      if (!scrape) return [register, list];

      const byCrn = new Map(scrape.sections.map((s) => [s.crn, s]));
      return [
        register,
        list.map((section) => {
          const read = byCrn.get(section.crn);
          if (!read) return section;
          return {
            ...section,
            faculty: read.faculty,
            description: read.description ?? section.description,
            prereqs: read.prereqs ?? section.prereqs,
            coreqs: read.coreqs ?? section.coreqs,
          };
        }),
      ];
    }),
  );

  return { ...snapshot, courses, sections };
}
