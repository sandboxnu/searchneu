/**
 * Step 4 - scrapes due courses from Banner.
 *
 * A course is all or nothing: if any of its requests fails, nothing about
 * it is kept and it stays due for the next pass.
 */

import { decode } from "html-entities";
import type { Requisite, Subject } from "../../types";
import type {
  SnapshotCourse,
  SnapshotSection,
  TermSnapshot,
} from "../../schemas/scraper/snapshot";
import { parseCoreqs, parsePrereqs } from "../../generate/steps/reqs";
import type { ScraperEventEmitter } from "../../events";
import type { BannerClient } from "../client";
import type { DueCourse } from "./due";

/** Banner's bannerId is only used to deduplicate; the snapshot drops it. */
type SnapshotFaculty = SnapshotSection["faculty"][number];

export interface SectionScrape {
  crn: string;
  faculty: SnapshotFaculty[];
  /** only read for special topics, whose sections are each their own course */
  description?: string;
  prereqs?: Requisite;
  coreqs?: Requisite;
}

export interface CourseScrape {
  register: string;
  name: string;
  /** left empty for special topics, which read these per section */
  description: string;
  prereqs: Requisite;
  coreqs: Requisite;
  sections: SectionScrape[];
}

export interface ScrapeFailure {
  register: string;
  message: string;
}

export interface ExecuteResult {
  courses: CourseScrape[];
  failures: ScrapeFailure[];
}

export async function execute(
  client: BannerClient,
  term: string,
  snapshot: TermSnapshot,
  due: DueCourse[],
  // requisites name subjects in plain text, so they match the decoded names
  subjects: Subject[],
  emitter?: ScraperEventEmitter,
): Promise<ExecuteResult> {
  const byRegister = new Map(
    snapshot.courses.map((c) => [c.subject + c.courseNumber, c]),
  );

  const courses: CourseScrape[] = [];
  const failures: ScrapeFailure[] = [];

  // the client's own gate bounds what actually reaches Banner
  await Promise.all(
    due.map(async ({ register, sections }) => {
      const course = byRegister.get(register);
      if (!course || sections.length === 0) return;

      try {
        courses.push(
          await scrapeCourse(client, term, course, sections, subjects),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ register, message });
        emitter?.emit("fetch:error", {
          crn: sections[0].crn,
          step: "course",
          message,
        });
      }
    }),
  );

  return { courses, failures };
}

async function scrapeCourse(
  client: BannerClient,
  term: string,
  course: SnapshotCourse,
  sections: SnapshotSection[],
  subjects: Subject[],
): Promise<CourseScrape> {
  // course-scoped detail is read through any one of its sections
  const crn = sections[0].crn;
  const topics = course.specialTopics;

  const [name, description, prereqs, coreqs, sectionScrapes] =
    await Promise.all([
      client.catalogDetails(term, crn).then(parseTitle),
      topics ? "" : client.courseDescription(term, crn).then(parseDescription),
      topics ? {} : readPrereqs(client, term, crn, subjects),
      topics ? {} : readCoreqs(client, term, crn, subjects),
      Promise.all(
        sections.map((s) =>
          scrapeSection(client, term, s.crn, topics, subjects),
        ),
      ),
    ]);

  return {
    register: course.subject + course.courseNumber,
    name,
    description,
    prereqs,
    coreqs,
    sections: sectionScrapes,
  };
}

async function scrapeSection(
  client: BannerClient,
  term: string,
  crn: string,
  topics: boolean,
  subjects: Subject[],
): Promise<SectionScrape> {
  const faculty = client.facultyMeetingTimes(term, crn).then(parseFaculty);
  if (!topics) return { crn, faculty: await faculty };

  const [f, description, prereqs, coreqs] = await Promise.all([
    faculty,
    client.courseDescription(term, crn).then(parseDescription),
    readPrereqs(client, term, crn, subjects),
    readCoreqs(client, term, crn, subjects),
  ]);
  return { crn, faculty: f, description, prereqs, coreqs };
}

async function readPrereqs(
  client: BannerClient,
  term: string,
  crn: string,
  subjects: Subject[],
): Promise<Requisite> {
  const html = await client.prerequisites(term, crn);
  return parsePrereqs(decode(decode(html)), subjects);
}

async function readCoreqs(
  client: BannerClient,
  term: string,
  crn: string,
  subjects: Subject[],
): Promise<Requisite> {
  const html = await client.corequisites(term, crn);
  return parseCoreqs(decode(decode(html)), subjects);
}

function parseTitle(html: string): string {
  const text = decode(decode(html))
    .replace(/<[^>]*>/g, "")
    .trim();
  return text.match(/^Title:(.*)$/m)?.[1].trim() || "Unknown";
}

function parseDescription(html: string): string {
  return decode(decode(html))
    .replace(/<[^>]*>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

function parseFaculty(response: {
  fmt: {
    faculty: {
      bannerId: string;
      displayName: string;
      emailAddress: string | null;
      primaryIndicator: boolean;
    }[];
  }[];
}): SnapshotFaculty[] {
  const byBannerId = new Map<string, SnapshotFaculty>();

  for (const meeting of response.fmt) {
    for (const f of meeting.faculty) {
      if (byBannerId.has(f.bannerId)) continue;
      byBannerId.set(f.bannerId, {
        displayName: decode(decode(f.displayName)),
        email: f.emailAddress,
        primary: f.primaryIndicator,
      });
    }
  }

  return [...byBannerId.values()];
}
