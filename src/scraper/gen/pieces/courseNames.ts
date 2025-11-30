import type { Course } from "@/scraper/types";
import { FetchEngine } from "../fetch";
import { sectionCatalogDetailsEndpoint } from "../endpoints";
import { logger } from "@/lib/logger";
import { decode } from "he";
import { BannerSectionCatalogDetails } from "@/scraper/schemas/sectionCatalogDetails";

/**
 *
 */
export async function scrapeCatalogDetails(
  fe: FetchEngine,
  term: string,
  courses: (Course & { crn: string })[],
) {
  const failedRequests: string[] = [];
  const catalogDetailsRequests: (() => Promise<void>)[] = [];

  for (const c of courses) {
    catalogDetailsRequests.push(async () => {
      const [url, body] = sectionCatalogDetailsEndpoint(term, c.crn);
      const resp = await fe
        .fetch(url, {
          ...body,
          onRetry(attempt) {
            // retries are part of the process, just log it if debugging
            logger.debug(
              { course: c.subject + c.courseNumber, attempt },
              "retrying course name for course",
            );
          },
        })
        .then((r) => r.text())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the course
          failedRequests.push(c.crn);
          logger.error(
            { error: e, crn: c.crn, course: c.subject + c.courseNumber },
            "error scraping course name",
          );
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const catalogDetailsResult =
        await BannerSectionCatalogDetails.safeParseAsync(resp);

      if (!catalogDetailsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        logger.error(
          {
            error: catalogDetailsResult.error,
            crn: c.crn,
            course: c.subject + c.courseNumber,
          },
          "error scraping course name",
        );
        return;
      }

      const catalogDetails = catalogDetailsResult.data;

      if (!catalogDetails) {
        return;
      }

      c.name =
        decode(decode(catalogDetails))
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .trim()
          .match(/^Title:(.*)$/m)?.[1]
          .trim() || "Unknown";
    });
  }

  // trigger all the scrape promises (this is the *do* step)
  const catalogDetailsPromises = catalogDetailsRequests.map((p) => p());

  // await all of the promises
  await Promise.all(catalogDetailsPromises);

  return failedRequests;
}
