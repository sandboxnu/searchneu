import type { Course } from "../../types";
import { FetchEngine } from "../fetch";
import { sectionCatalogDetailsEndpoint } from "../endpoints";
import { decode } from "html-entities";
import { BannerSectionCatalogDetails } from "../../schemas/banner/sectionCatalogDetails";
import type { ScraperEventEmitter } from "../../events";

/**
 *
 */
export async function scrapeCatalogDetails(
  fe: FetchEngine,
  term: string,
  courses: (Course & { crn: string })[],
  emitter?: ScraperEventEmitter,
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
            emitter?.emit("fetch:retry", {
              crn: c.crn,
              step: "catalog-details",
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
            step: "catalog-details",
            message: String(e),
          });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const catalogDetailsResult =
        await BannerSectionCatalogDetails.safeParseAsync(resp);

      if (!catalogDetailsResult.success) {
        // if the parse fails: note the crn, log the error, and skip the course
        failedRequests.push(c.crn);
        emitter?.emit("fetch:error", {
          crn: c.crn,
          step: "catalog-details",
          message: String(catalogDetailsResult.error),
        });
        return;
      }

      const catalogDetails = catalogDetailsResult.data;

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
