import { consola } from "consola";
import { scrapeSections } from "./pieces/sections";
import { subjectsEndpoint } from "./endpoints";
import { decode } from "html-entities";
import { FetchEngine, $fetch } from "./fetch";
import { populatePostReqs } from "./pieces/reqs";
import { scrapeMeetingsFaculty } from "./pieces/meetingsFaculty";
import * as z from "zod";
import { scrapeCatalogDetails } from "./pieces/courseNames";
import { TermConfig } from "../config";
import { scrapeCourseDescriptions } from "./pieces/courseDescriptions";
import { scrapeCoursePrereqs } from "./pieces/coursePrereqs";
import { scrapeCourseCoreqs } from "./pieces/courseCoreqs";
import { arrangeCourses } from "./marshall";
import { parseRooms } from "./pieces/rooms";
import { TermScrape } from "../types";

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
): Promise<TermScrape | undefined> {
  // get sections
  consola.start("scraping sections");
  const rawSections = await scrapeSections(term);
  if (!rawSections) {
    consola.error("failed to scrape sections");
    return;
  }

  // stub courses from sections
  consola.info("stubbing courses");
  const {
    courses,
    sections,
    subjects: subjectCodes,
    campuses,
  } = arrangeCourses(rawSections);
  const sectionList = Object.values(sections).flat();

  // get and validate subjects
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
    consola.warn("differing quantity of subjects", {
      extracted: subjectCodes.length,
      banner: subjects.length,
    });
  }

  // getTermInfo gets the name for the term being scraped from banner
  const resp: any = await $fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=10&searchTerm=${term}`,
  ).then((resp) => resp.json());

  const fe = new FetchEngine({
    maxRetries: 5,
    initialRetryDelay: 1000,
    throttleDelay: 0,
    maxConcurrent: 20,
    retryOn: (response) => response.status === 429 || response.status >= 500,
  });

  // scrape faculty
  const failedFacultySections = scrapeMeetingsFaculty(fe, term, sectionList);

  const taggedCourses = courses.map((c) => ({
    ...c,
    crn: sections[c.subject + c.courseNumber][0].crn,
  }));

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
    .map((c) => ({
      ...c,
      crn: sections[c.subject + c.courseNumber][0].crn,
    }));
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

  consola.box(
    `scraping stats
totals:
  courses: ${courses.length}
  sections: ${Object.values(sections).flat().length}
standard: ${ordinaryCourses.length} (x3)
special topics:
  courses: ${stc.length}
  sections: ${specialTopicSections.length} (x3)`,
  );

  const intervalCleanup = setInterval(() => consola.info(fe.getStatus()), 5000);

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

  // postreqs
  populatePostReqs(courses);

  clearTimeout(intervalCleanup);

  const [rooms, buildingCampuses] = await parseRooms(
    Object.values(sections).flat(),
  );

  return {
    term: resp[0],
    courses: courses,
    sections: sections,
    subjects,
    rooms,
    buildingCampuses,
  };

  // get term info
  //
  // get nupaths
  // get campuses
}
