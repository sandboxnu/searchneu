import type { Requisite, Subject } from "../../types";
import { FetchEngine } from "../fetch";
import { sectionPrereqsEndpoint } from "../endpoints";
import { consola } from "consola";
import { decode } from "html-entities";
import { BannerSectionPrereqs } from "../../schemas/banner/sectionPrereqs";
import { parsePrereqs } from "./reqs";

/**
 *
 *
 * @param fe fetch engine to use (in order to throttle requests)
 * @param term the term to scrape from
 * @param items list of sections or tagged courses. these are updated in place with prereq information
 * @param subjects list of subjects. used in calculating prereqs
 * @returns list of crns which failed being scraped
 */
export async function scrapeCoursePrereqs(
  fe: FetchEngine,
  term: string,
  items: ({ crn: string; prereqs: Requisite } & { [key: string]: unknown })[],
  subjects: Subject[],
) {
  const failedRequests: string[] = [];
  const prereqRequests: (() => Promise<void>)[] = [];

  for (const c of items) {
    prereqRequests.push(async () => {
      const [url, body] = sectionPrereqsEndpoint(term, c.crn);
      const resp = await fe
        .fetch(url, {
          ...body,
          onRetry(attempt) {
            // retries are part of the process, just log it if debugging
            consola.debug("retrying prereqs for course", {
              // course: c.subject + c.courseNumber,
              crn: c.crn,
              attempt,
            });
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          consola.error("error scraping prereqs", {
            error: e,
            crn: c.crn,
            // course: c.subject + c.courseNumber,
          });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const prereqsResult = await BannerSectionPrereqs.safeParseAsync(resp);

      if (!prereqsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        consola.error("error scraping prereqs", {
          error: prereqsResult.error,
          crn: c.crn,
          // course: c.subject + c.courseNumber,
        });
        return;
      }

      const prereqsData = prereqsResult.data;

      if (!prereqsData) {
        return;
      }

      c.prereqs = parsePrereqs(decode(decode(prereqsData)), subjects);
    });
  }

  // trigger all the scrape promises (this is the *do* step)
  const prereqPromises = prereqRequests.map((p) => p());

  // await all of the promises
  await Promise.all(prereqPromises);

  return failedRequests;
}
