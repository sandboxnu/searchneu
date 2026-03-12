import type { Requisite, Subject } from "../../types";
import { FetchEngine } from "../fetch";
import { sectionPrereqsEndpoint } from "../endpoints";
import { decode } from "html-entities";
import { BannerSectionPrereqs } from "../../schemas/banner/sectionPrereqs";
import { parsePrereqs } from "./reqs";
import type { ScraperEventEmitter } from "../../events";

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
  emitter?: ScraperEventEmitter,
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
            emitter?.emit("fetch:retry", {
              crn: c.crn,
              step: "prereqs",
              attempt,
            });
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          emitter?.emit("fetch:error", {
            crn: c.crn,
            step: "prereqs",
            message: String(e),
          });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const prereqsResult = await BannerSectionPrereqs.safeParseAsync(resp);

      if (!prereqsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        emitter?.emit("fetch:error", {
          crn: c.crn,
          step: "prereqs",
          message: String(prereqsResult.error),
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
