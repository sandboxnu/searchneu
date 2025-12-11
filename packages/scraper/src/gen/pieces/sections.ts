import { $fetch } from "../fetch";
import { sectionSearchEndpoint } from "../endpoints";
import { consola } from "consola";
import { BannerSectionResponse } from "../../schemas/section";

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
  const cookies = await getAuthCookies(term, cookiePool + 1);
  consola.debug("auth cookies aquired", { term: term });

  const initalCookie = cookies.pop();
  if (!initalCookie) {
    consola.error("not enough cookies");
    return;
  }

  // get just the first section to see how many are in a term
  const initialSectionResp = await $fetch(sectionSearchEndpoint(term, 0, 1), {
    headers: {
      Cookie: initalCookie,
    },
  }).then((resp) => resp.json());

  const initialSectionRespResult =
    BannerSectionResponse.safeParse(initialSectionResp);
  if (!initialSectionRespResult.success) {
    consola.error("error parsing inital section response", {
      error: initialSectionRespResult.error,
    });
    return;
  }

  const initialResp = initialSectionRespResult.data;

  // number of batches we have to do. each page can return up to 500 sections and
  // we only have `cookiePool` number of cookies
  const numBatches = Math.ceil(
    Math.ceil(initialResp.totalCount / 500) / cookiePool,
  );

  consola.debug("section count received", {
    term: term,
    count: initialResp.totalCount,
    batches: numBatches,
  });

  const rawSections: unknown[] = [];

  for (let i = 0; i < numBatches; i++) {
    consola.debug("scraping sections for batch", { term: term, batch: i });
    const promises = Array.from([...Array(cookiePool).keys()], (j) =>
      $fetch(sectionSearchEndpoint(term, (i * cookiePool + j) * 500, 500), {
        headers: {
          Cookie: cookies[j],
        },
      }).then((resp) => resp.json() as any),
    );

    consola.debug("start section requests", { term: term, batch: i });
    const results = await Promise.allSettled(promises);
    consola.debug("received section responses", { term: term, batch: i });

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p) => {
        rawSections.push(...p.value.data);
      });

    consola.debug("marshalled sections", { term: term, batch: i });
  }

  const rawSectionResult = BannerSectionResponse.pick({ data: true }).safeParse(
    { data: rawSections },
  );
  if (!rawSectionResult.success) {
    consola.error("error parsing sections", { e: rawSectionResult.error });
    return;
  }

  const sections = rawSectionResult.data.data;

  if (sections.length !== initialResp.totalCount) {
    consola.warn("section count mismatch", {
      term: term,
      expected: initialResp.totalCount,
      actual: rawSections.length,
    });
  }

  return sections;
}

// getAuthCookies get a bunch of cookies from the banner api. A cookie is required
// to access the search pages - by getting a bunch, we can fire a bunch
// of concurrent requests
async function getAuthCookies(term: string, count: number) {
  consola.debug("start getting auth cookies");
  const promises = Array.from({ length: count }, () =>
    fetch("https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UT",
      },
      body: `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
    }),
  );

  consola.debug("start auth cookie requests");
  const results = await Promise.allSettled<Promise<Response>>(promises);
  consola.debug("received auth cookie responses");

  const cookies = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => {
      const setCookies = result.value.headers.getSetCookie();
      const cookiePairs = setCookies.map((cookie) => {
        return cookie.split(";")[0].trim();
      });

      return cookiePairs.join("; ");
    });

  consola.debug("auth cookies marshalled");

  return cookies;
}
