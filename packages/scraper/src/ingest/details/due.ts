/**
 * Step 3 - which courses to scrape this pass.
 *
 * A course is scraped as a whole: its detail and every section's faculty.
 * It is due once its TTL has run out, counted from `courses.updatedAt`, or
 * straight away when the catalog has not seen it or one of its sections. A
 * row Banner had stopped listing counts as unseen when it comes back.
 */

import type {
  SnapshotSection,
  TermSnapshot,
} from "../../schemas/scraper/snapshot";
import type {
  PartState,
  SectionRow,
  CourseRow,
  TermState,
} from "../sync/state";

export interface DueCourse {
  register: string;
  /** the sections the pass may write, so the ones worth reading */
  sections: SnapshotSection[];
}

export interface DueOptions {
  now: Date;
  ttlMs: number;
  /** courses one pass may scrape */
  budget: number;
  /** whether sections are bucketed into term rows by part of term */
  split: boolean;
}

export function dueCourses(
  snapshot: TermSnapshot,
  state: TermState,
  options: DueOptions,
): DueCourse[] {
  const partFor = partLookup(state, options.split);
  const candidates: { due: DueCourse; unseen: boolean; scrapedAt: number }[] =
    [];

  for (const course of snapshot.courses) {
    const register = course.subject + course.courseNumber;
    const sections: SnapshotSection[] = [];
    let unseen = false;
    let scrapedAt = Infinity;

    for (const section of snapshot.sections[register] ?? []) {
      // a frozen or unconfigured part is never written, so is not read
      const part = partFor(section.partOfTerm);
      if (!part) continue;
      sections.push(section);

      const row = part.courses.get(register);
      const sectionRow = part.sections.get(section.crn);
      if (!row || !sectionRow || isMarked(row) || isMarked(sectionRow)) {
        unseen = true;
      } else {
        scrapedAt = Math.min(scrapedAt, row.updatedAt.getTime());
      }
    }

    if (sections.length === 0) continue;
    if (!unseen && options.now.getTime() - scrapedAt < options.ttlMs) continue;

    candidates.push({ due: { register, sections }, unseen, scrapedAt });
  }

  // unseen courses first, then the longest since their last scrape
  candidates.sort(
    (a, b) => Number(b.unseen) - Number(a.unseen) || a.scrapedAt - b.scrapedAt,
  );

  return candidates.slice(0, options.budget).map((c) => c.due);
}

function partLookup(
  state: TermState,
  split: boolean,
): (partOfTerm: string) => PartState | undefined {
  if (split) return (partOfTerm) => state.parts.get(partOfTerm);

  // an unsplit term has a single row that holds every section
  const [first] = [...state.parts.keys()].sort();
  const only = first === undefined ? undefined : state.parts.get(first);
  return () => only;
}

function isMarked(row: CourseRow | SectionRow): boolean {
  return row.missingSince !== null || row.tombstonedAt !== null;
}
