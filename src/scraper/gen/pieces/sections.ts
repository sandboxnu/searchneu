import { $fetch } from "../fetch";
import { sectionSearchEndpoint } from "../endpoints";
import { logger } from "@/lib/logger";
import * as z from "zod";
import {
  BannerSection,
  BannerSectionResponse,
} from "@/scraper/schemas/section";

/**
 * scrapeSections get all the sections in a term. It steps through the pages of search results
 * to get all the sections in a term. The cookie pool represents how many cookies to get
 * (ie number of concurrent requests to send in a batch)
 *
 * @param term The term to be scrape sections from
 * @param cookiePool The number of cookies to use
 * @returns raw scraped sections
 */
export async function scrapeSections(term: string, cookiePool = 20) {
  // create the pool of cookies to use; section search requests require a cookie section to Banner
  const cookies = await getAuthCookies(term, cookiePool);
  logger.debug({ term: term }, "auth cookies aquired");

  // get just the first section to see how many are in a term
  const initialSectionResp = await $fetch(sectionSearchEndpoint(term, 0, 1), {
    headers: {
      Cookie: cookies[0],
    },
  }).then((resp) => resp.json());

  // number of batches we have to do. each page can return up to 500 sections and
  // we only have `cookiePool` number of cookies
  const numBatches = Math.ceil(
    Math.ceil(initialSectionResp.totalCount / 500) / cookiePool,
  );

  logger.debug(
    {
      term: term,
      count: initialSectionResp.totalCount,
      batches: numBatches,
    },
    "section count received",
  );

  const rawSections: z.infer<typeof BannerSection>[] = [];

  for (let i = 0; i < numBatches; i++) {
    logger.debug({ term: term, batch: i }, "scraping sections for batch");
    const promises = Array.from([...Array(cookiePool).keys()], (j) =>
      fetch(sectionSearchEndpoint(term, (i * cookiePool + j) * 500, 500), {
        headers: {
          Cookie: cookies[j],
        },
      }).then((resp) => resp.json()),
    );

    logger.trace({ term: term, batch: i }, "start section requests");
    const results = await Promise.allSettled(promises);
    logger.trace({ term: term, batch: i }, "received section responses");

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p) => {
        rawSections.push(...p.value.data);
      });

    logger.trace({ term: term, batch: i }, "marshalled sections");
  }

  if (rawSections.length !== initialSectionResp.totalCount) {
    logger.warn(
      {
        term: term,
        expected: initialSectionResp.totalCount,
        actual: rawSections.length,
      },
      "section count mismatch",
    );
  }

  return rawSections;
}

// getAuthCookies get a bunch of cookies from the banner api. A cookie is required
// to access the search pages - by getting a bunch, we can fire a bunch
// of concurrent requests
async function getAuthCookies(term: string, count: number) {
  logger.trace("start getting auth cookies");
  const promises = Array.from({ length: count }, () =>
    fetch("https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UT",
      },
      body: `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
    }),
  );

  logger.trace("start auth cookie requests");
  const results = await Promise.allSettled<Promise<Response>>(promises);
  logger.trace("received auth cookie responses");

  const cookies = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => {
      const setCookies = result.value.headers.getSetCookie();
      const cookiePairs = setCookies.map((cookie) => {
        return cookie.split(";")[0].trim();
      });

      return cookiePairs.join("; ");
    });

  logger.trace("auth cookies marshalled");

  return cookies;
}
