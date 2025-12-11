import type { Requisite, Subject } from "../../types";
import { FetchEngine } from "../fetch";
import { sectionCoreqsEndpoint } from "../endpoints";
import { consola } from "consola";
import { decode } from "html-entities";
import { BannerSectionCoreqs } from "../../schemas/sectionCoreqs";
import { parseCoreqs } from "./reqs";

/**
 *
 *
 * @param fe fetch engine to use (in order to throttle requests)
 * @param term the term to scrape from
 * @param items list of sections or tagged courses. these are updated in place with coreq information
 * @param subjects list of subjects. used in calculating coreqs
 * @returns list of crns which failed being scraped
 */
export async function scrapeCourseCoreqs(
  fe: FetchEngine,
  term: string,
  items: ({ crn: string; prereqs: Requisite } & { [key: string]: any })[],
  subjects: Subject[],
) {
  const failedRequests: string[] = [];
  const coreqRequests: (() => Promise<void>)[] = [];

  for (const c of items) {
    coreqRequests.push(async () => {
      const [url, body] = sectionCoreqsEndpoint(term, c.crn);
      const resp = await fe
        .fetch(url, {
          ...body,
          onRetry(attempt) {
            // retries are part of the process, just log it if debugging
            consola.debug("retrying coreqs for course", {
              course: c.subject + c.courseNumber,
              attempt,
            });
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          consola.error("error scraping coreqs", {
            error: e,
            crn: c.crn,
            course: c.subject + c.courseNumber,
          });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const coreqsResult = await BannerSectionCoreqs.safeParseAsync(resp);

      if (!coreqsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        consola.error("error scraping coreqs", {
          error: coreqsResult.error,
          crn: c.crn,
          course: c.subject + c.courseNumber,
        });
        return;
      }

      const coreqsData = coreqsResult.data;

      if (!coreqsData) {
        return;
      }

      c.coreqs = parseCoreqs(decode(decode(coreqsData)), subjects);
    });
  }

  // trigger all the scrape promises (this is the *do* step)
  const coreqPromises = coreqRequests.map((p) => p());

  // await all of the promises
  await Promise.all(coreqPromises);

  return failedRequests;
}
