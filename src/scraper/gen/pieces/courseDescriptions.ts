import type { Requisite } from "@/scraper/types";
import { FetchEngine } from "../fetch";
import { courseDescriptionEndpoint } from "../endpoints";
import { logger } from "@/lib/logger";
import { decode } from "he";
import { BannerSectionDescription } from "@/scraper/schemas/sectionDescription";

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
            logger.debug(
              { course: c.subject + c.courseNumber, attempt },
              "retrying description for course",
            );
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          logger.error(
            { error: e, crn: c.crn, course: c.subject + c.courseNumber },
            "error scraping description",
          );
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const catalogDetailsResult =
        await BannerSectionDescription.safeParseAsync(resp);

      if (!catalogDetailsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        logger.error(
          {
            error: catalogDetailsResult.error,
            crn: c.crn,
            course: c.subject + c.courseNumber,
          },
          "error scraping description",
        );
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
