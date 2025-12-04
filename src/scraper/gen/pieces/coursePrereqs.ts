import type { Requisite, Subject } from "@/scraper/types";
import { FetchEngine } from "../fetch";
import { sectionPrereqsEndpoint } from "../endpoints";
import { logger } from "@/lib/logger";
import { decode } from "he";
import { BannerSectionPrereqs } from "@/scraper/schemas/sectionPrereqs";
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
  items: ({ crn: string; prereqs: Requisite } & { [key: string]: any })[],
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
            logger.debug(
              { course: c.subject + c.courseNumber, attempt },
              "retrying prereqs for course",
            );
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          logger.error(
            { error: e, crn: c.crn, course: c.subject + c.courseNumber },
            "error scraping prereqs",
          );
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const prereqsResult = await BannerSectionPrereqs.safeParseAsync(resp);

      if (!prereqsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        logger.error(
          {
            error: prereqsResult.error,
            crn: c.crn,
            course: c.subject + c.courseNumber,
          },
          "error scraping prereqs",
        );
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
