import type { Requisite } from "../../types";
import { FetchEngine } from "../fetch";
import { courseDescriptionEndpoint } from "../endpoints";
import { consola } from "consola";
import { decode } from "html-entities";
import { BannerSectionDescription } from "../../schemas/sectionDescription";

/**
 *
 *
 * @param fe fetch engine to use (in order to throttle requests)
 * @param term the term to scrape from
 * @param items list of sections or tagged courses. these are updated in place with description information
 * @returns list of crns which failed being scraped
 */
export async function scrapeCourseDescriptions(
  fe: FetchEngine,
  term: string,
  items: ({ crn: string; prereqs: Requisite } & { [key: string]: any })[],
) {
  const failedRequests: string[] = [];
  const courseDescriptionRequests: (() => Promise<void>)[] = [];

  for (const c of items) {
    courseDescriptionRequests.push(async () => {
      const [url, body] = courseDescriptionEndpoint(term, c.crn);
      const resp = await fe
        .fetch(url, {
          ...body,
          onRetry(attempt) {
            // retries are part of the process, just log it if debugging
            consola.debug("retrying description for course", {
              course: c.subject + c.courseNumber,
              attempt,
            });
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          consola.error("error scraping description", {
            error: e,
            crn: c.crn,
            course: c.subject + c.courseNumber,
          });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const catalogDetailsResult =
        await BannerSectionDescription.safeParseAsync(resp);

      if (!catalogDetailsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        consola.error("error scraping description", {
          error: catalogDetailsResult.error,
          crn: c.crn,
          course: c.subject + c.courseNumber,
        });
        return;
      }

      const catalogDetails = catalogDetailsResult.data;

      if (!catalogDetails) {
        return;
      }

      c.description = decode(decode(catalogDetails))
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
        .trim();
    });
  }

  // trigger all the scrape promises (this is the *do* step)
  const courseDescriptionPromises = courseDescriptionRequests.map((p) => p());

  // await all of the promises
  await Promise.all(courseDescriptionPromises);

  return failedRequests;
}
