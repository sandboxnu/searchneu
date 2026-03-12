/**
 * the main scraper flow
 */

import { scrapeSections } from "./steps/sections";
import { subjectsEndpoint } from "./endpoints";
import { decode } from "html-entities";
import { FetchEngine, $fetch } from "./fetch";
import { populatePostReqs } from "./steps/reqs";
import { scrapeMeetingsFaculty } from "./steps/meetingsFaculty";
import * as z from "zod";
import { scrapeCatalogDetails } from "./steps/courseNames";
import { scrapeCourseDescriptions } from "./steps/courseDescriptions";
import { scrapeCoursePrereqs } from "./steps/coursePrereqs";
import { scrapeCourseCoreqs } from "./steps/courseCoreqs";
import { arrangeCourses } from "./marshall";
import { scrapeTermDefinition } from "./steps/terms";
import { ScraperBannerCache } from "../schemas/scraper/banner-cache";
import type { ScraperEventEmitter } from "../events";
import { scrapeCampuses } from "./steps/campuses";

/**
 * scrapeCatalogTerm is the main scraping logic
 *
 * @param term the banner catalog term to scrape
 * @param config scraper configuration
 * @param emitter event emitter for reporting progress
 * @returns term scrape object
 */
export async function scrapeCatalogTerm(
  term: string,
  emitter?: ScraperEventEmitter,
): Promise<
  Omit<z.infer<typeof ScraperBannerCache>, "timestamp" | "version"> | undefined
> {
  emitter?.emit("scrape:start", { term });

  // get sections
  const rawSections = await scrapeSections(term, emitter);
  if (!rawSections) {
    emitter?.emit("error", { message: "failed to scrape sections" });
    return;
  }

  // stub courses from sections
  const { courses, sections, attributes } = arrangeCourses(
    rawSections,
    emitter,
  );
  const sectionList = Object.values(sections).flat();

  // get and validate subjects
  emitter?.emit("scrape:subjects:start");
  const bannerSubjects = await $fetch(subjectsEndpoint(term)).then(
    (r) => r.json() as Promise<{ code: string; description: string }[]>,
  );
  const subjects = bannerSubjects.map((subj) => ({
    code: subj.code,
    description: decode(subj.description),
  }));
  emitter?.emit("scrape:subjects:done", { count: subjects.length });

  emitter?.emit("scrape:campuses:start");
  const bannerCampuses = await scrapeCampuses(term);
  if (!bannerCampuses) {
    emitter?.emit("error", {
      message: "error getting campuses from Banner",
    });
    return;
  }
  emitter?.emit("scrape:campuses:done", { count: 0 });

  // TODO: scrape part of Term
  // NOTE: this is less important and really just for... i dunno really

  // getTermInfo gets the name for the term being scraped from banner
  emitter?.emit("scrape:term-definition:start");
  const termDef = await scrapeTermDefinition(term, emitter);
  if (!termDef) {
    emitter?.emit("error", {
      message: "error getting term definition from Banner",
    });
    return;
  }
  emitter?.emit("scrape:term-definition:done", {
    code: termDef.code,
    description: termDef.description,
  });

  const fe = new FetchEngine({
    maxRetries: 5,
    initialRetryDelay: 1000,
    throttleDelay: 0,
    maxConcurrent: 20,
    retryOn: (response) => response.status === 429 || response.status >= 500,
  });

  emitter?.emit("debug", { message: "generating scraping promises" });

  // scrape faculty
  const failedFacultySections = scrapeMeetingsFaculty(
    fe,
    term,
    sectionList,
    emitter,
  );

  const taggedCourses = courses.map((c) =>
    Object.assign(c, { crn: sections[c.subject + c.courseNumber][0].crn }),
  );

  // names
  // PERF: we could prob just do the special topic courses, but we should be sure that just those need
  // an updated name
  const failedCatalogDetailCourses = scrapeCatalogDetails(
    fe,
    term,
    taggedCourses,
    emitter,
  );

  // ===== scrape information for "ordinary" (ie non special topics) courses =====
  // descriptions
  const ordinaryCourses = courses
    .filter((c) => !c.specialTopics)
    .map((c) =>
      Object.assign(c, { crn: sections[c.subject + c.courseNumber][0].crn }),
    );

  const failedDescriptions = scrapeCourseDescriptions(
    fe,
    term,
    ordinaryCourses,
    emitter,
  );

  // prereqs
  const failedPrereqPromises = scrapeCoursePrereqs(
    fe,
    term,
    ordinaryCourses,
    subjects,
    emitter,
  );

  // coreqs
  const failedCoreqPromises = scrapeCourseCoreqs(
    fe,
    term,
    ordinaryCourses,
    subjects,
    emitter,
  );

  // ===== scrape information for special topics courses =====
  // descriptions
  const stc = courses.filter((c) => c.specialTopics);
  const specialTopicSections = stc
    .map((c) => sections[c.subject + c.courseNumber])
    .flat();
  const stFailedDescriptions = scrapeCourseDescriptions(
    fe,
    term,
    specialTopicSections,
    emitter,
  );

  // prereqs
  const stFailedPrereqPromises = scrapeCoursePrereqs(
    fe,
    term,
    specialTopicSections,
    subjects,
    emitter,
  );

  // coreqs
  const stFailedCoreqPromises = scrapeCourseCoreqs(
    fe,
    term,
    specialTopicSections,
    subjects,
    emitter,
  );

  emitter?.emit("scrape:stats", {
    totalCourses: courses.length,
    totalSections: Object.values(sections).flat().length,
    ordinaryCourses: ordinaryCourses.length,
    ordinarySections:
      Object.values(sections).flat().length - specialTopicSections.length,
    specialTopicsCourses: stc.length,
    specialTopicsSections: specialTopicSections.length,
    totalRequests: fe.getStatus().queueLength,
    estimatedMinutes: Math.floor(fe.getStatus().queueLength / 20 / 60),
  });

  emitter?.emit("scrape:detail:start");
  const initialQueueLength = fe.getStatus().queueLength;
  const intervalCleanup = setInterval(() => {
    const status = fe.getStatus();
    emitter?.emit("scrape:detail:progress", {
      remaining: status.queueLength,
      total: initialQueueLength,
      percent: Math.floor(
        ((initialQueueLength - status.queueLength) / initialQueueLength) * 100,
      ),
      active: status.activeRequests,
    });
  }, 5000);

  // wait for all the requests
  await Promise.all([
    failedFacultySections,
    failedCatalogDetailCourses,
    failedDescriptions,
    failedPrereqPromises,
    failedCoreqPromises,
    stFailedDescriptions,
    stFailedPrereqPromises,
    stFailedCoreqPromises,
  ]);

  clearTimeout(intervalCleanup);
  emitter?.emit("scrape:detail:done");

  // postreqs
  populatePostReqs(courses);

  const parsedAttributes = [...attributes].map((v) => ({
    code: v[0],
    name: v[1],
  }));

  emitter?.emit("scrape:done", { term });

  return {
    term: termDef,
    courses: courses,
    sections: sections,
    attributes: parsedAttributes,
    subjects,
    campuses: bannerCampuses,
  };
}
