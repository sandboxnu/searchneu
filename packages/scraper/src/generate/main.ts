/**
 * the main scraper flow
 */

import { consola } from "consola";
import { scrapeSections } from "./steps/sections";
import { subjectsEndpoint } from "./endpoints";
import { decode } from "html-entities";
import { FetchEngine, $fetch } from "./fetch";
import { populatePostReqs } from "./steps/reqs";
import { scrapeMeetingsFaculty } from "./steps/meetingsFaculty";
import * as z from "zod";
import { scrapeCatalogDetails } from "./steps/courseNames";
import { TermConfig } from "../config";
import { scrapeCourseDescriptions } from "./steps/courseDescriptions";
import { scrapeCoursePrereqs } from "./steps/coursePrereqs";
import { scrapeCourseCoreqs } from "./steps/courseCoreqs";
import { arrangeCourses } from "./marshall";
import { scrapeTermDefinition } from "./steps/terms";
import { ScraperBannerCache } from "../schemas/scraper/banner-cache";

/**
 * scrapeCatalogTerm is the main scraping logic
 *
 * @param term the banner catalog term to scrape
 * @param config scraper configuration
 * @returns term scrape object
 */
export async function scrapeCatalogTerm(
  term: string,
  config: z.infer<typeof TermConfig>,
  interactive: boolean,
): Promise<
  Omit<z.infer<typeof ScraperBannerCache>, "timestamp" | "version"> | undefined
> {
  // get sections
  const rawSections = await scrapeSections(term);
  if (!rawSections) {
    consola.error("failed to scrape sections");
    return;
  }

  // stub courses from sections
  const {
    courses,
    sections,
    subjects: subjectCodes,
    attributes,
    campuses,
    buildings,
    rooms,
  } = arrangeCourses(rawSections);
  const sectionList = Object.values(sections).flat();

  // get and validate subjects
  consola.debug("scraping subjects");
  const bannerSubjects: any = await $fetch(subjectsEndpoint(term)).then((r) =>
    r.json(),
  );
  const subjects: { code: string; description: string }[] = bannerSubjects.map(
    (subj: { code: string; description: string }) => ({
      code: subj.code,
      description: decode(subj.description),
    }),
  );

  if (subjectCodes.length !== subjects.length) {
    consola.warn(
      `subject count mismatch, banner: ${subjects.length} extracted: ${subjectCodes.length} diff: ${subjects.filter((s) => !subjectCodes.includes(s.code)).map((s) => s.code)}`,
    );
  }

  // getTermInfo gets the name for the term being scraped from banner
  consola.debug("scraping term definition");
  const termDef = await scrapeTermDefinition(term);
  if (!termDef) {
    consola.error("error getting term definition from Banner");
    return;
  }

  const fe = new FetchEngine({
    maxRetries: 5,
    initialRetryDelay: 1000,
    throttleDelay: 0,
    maxConcurrent: 20,
    retryOn: (response) => response.status === 429 || response.status >= 500,
  });

  consola.debug("generating scraping promises");

  // scrape faculty
  const failedFacultySections = scrapeMeetingsFaculty(fe, term, sectionList);

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
  );

  // prereqs
  const failedPrereqPromises = scrapeCoursePrereqs(
    fe,
    term,
    ordinaryCourses,
    subjects,
  );

  // coreqs
  const failedCoreqPromises = scrapeCourseCoreqs(
    fe,
    term,
    ordinaryCourses,
    subjects,
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
  );

  // prereqs
  const stFailedPrereqPromises = scrapeCoursePrereqs(
    fe,
    term,
    specialTopicSections,
    subjects,
  );

  // coreqs
  const stFailedCoreqPromises = scrapeCourseCoreqs(
    fe,
    term,
    specialTopicSections,
    subjects,
  );

  if (interactive)
    consola.box(
      `==scraping stats==
total:
  courses: ${courses.length}
  sections: ${Object.values(sections).flat().length}
standard:
  courses: ${ordinaryCourses.length}
  sections: ${Object.values(sections).flat().length - specialTopicSections.length}
special topics:
  courses: ${stc.length}
  sections: ${specialTopicSections.length}
requests:
  total: ${fe.getStatus().queueLength}
  etr: ${Math.floor(fe.getStatus().queueLength / 20 / 60)}mins`,
    );

  consola.start("scraping supporting information");
  const initialQueueLength = fe.getStatus().queueLength;
  const intervalCleanup = setInterval(() => {
    if (interactive) {
      consola.info(
        `${fe.getStatus().queueLength} remaining \
(${Math.floor(((initialQueueLength - fe.getStatus().queueLength) / initialQueueLength) * 100)}%) \
(${fe.getStatus().activeRequests} active)`,
      );
    }
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

  // postreqs
  populatePostReqs(courses);

  const parsedAttributes = [...attributes].map((v) => ({
    code: v[0],
    name: v[1],
  }));

  // ===== prepare objects to be saved =====
  const parsedCampuses = [...campuses].map((v) => ({
    // campuses are mapped description : code
    code: v[1].code,
    name: v[1].description,
  }));

  const parsedBuildings = [...buildings].map((v) => ({
    code: v[1].code,
    name: v[1].description,
    campus: v[1].campus,
  }));

  const parsedRooms = [...rooms]
    .map((v) => {
      return [...v[1].rooms].map((r) => ({
        code: r,
        building: v[1].building,
        campus: v[1].campus,
      }));
    })
    .flat();

  return {
    term: termDef,
    courses: courses,
    sections: sections,
    attributes: parsedAttributes,
    subjects,
    campuses: parsedCampuses,
    buildings: parsedBuildings,
    rooms: parsedRooms,
  };
}
