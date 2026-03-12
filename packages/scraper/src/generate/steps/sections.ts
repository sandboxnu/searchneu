import { $fetch } from "../fetch";
import { sectionSearchEndpoint } from "../endpoints";
import { BannerSectionResponse } from "../../schemas/banner/section";
import type { ScraperEventEmitter } from "../../events";

/**
 * scrapeSections get all the sections in a term. It steps through the pages of search results
 * to get all the sections in a term. The cookie pool represents how many cookies to get
 * (ie number of concurrent requests to send in a batch)
 *
 * @param term The term to be scrape sections from
 * @param cookiePool The number of cookies to use
 * @returns raw scraped sections
 */
export async function scrapeSections(
  term: string,
  emitter?: ScraperEventEmitter,
  cookiePool = 20,
) {
  emitter?.emit("scrape:sections:start", { term });

  // create the pool of cookies to use; section search requests require a cookie section to Banner
  const cookies = await getAuthCookies(term, cookiePool + 1);
  emitter?.emit("debug", {
    message: `${cookies.length} auth cookies acquired`,
  });

  const initalCookie = cookies.pop();
  if (!initalCookie) {
    emitter?.emit("error", { message: "not enough banner auth cookies" });
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
    emitter?.emit("error", {
      message: "error parsing initial section response",
      data: { error: String(initialSectionRespResult.error) },
    });
    return;
  }

  const initialResp = initialSectionRespResult.data;

  // number of batches we have to do. each page can return up to 500 sections and
  // we only have `cookiePool` number of cookies
  const numBatches = Math.ceil(
    Math.ceil(initialResp.totalCount / 500) / cookiePool,
  );

  emitter?.emit("debug", {
    message: `${initialResp.totalCount} sections - ${numBatches} batch(es) required`,
  });

  const rawSections: unknown[] = [];
  for (let i = 0; i < numBatches; i++) {
    emitter?.emit("scrape:sections:progress", {
      batch: i + 1,
      totalBatches: numBatches,
    });
    const promises = Array.from([...Array(cookiePool).keys()], (j) =>
      $fetch(sectionSearchEndpoint(term, (i * cookiePool + j) * 500, 500), {
        headers: {
          Cookie: cookies[j],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).then((resp) => resp.json() as any),
    );

    emitter?.emit("trace", {
      message: `start section requests for batch ${i + 1}`,
    });
    const results = await Promise.allSettled(promises);
    emitter?.emit("trace", {
      message: `received section responses for batch ${i + 1}`,
    });

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p) => {
        rawSections.push(...p.value.data);
      });

    emitter?.emit("trace", {
      message: `marshalled sections for batch ${i + 1}`,
    });
  }

  const rawSectionResult = BannerSectionResponse.pick({ data: true }).safeParse(
    { data: rawSections },
  );
  if (!rawSectionResult.success) {
    emitter?.emit("error", {
      message: "error parsing sections",
      data: { error: String(rawSectionResult.error) },
    });
    return;
  }

  const sections = rawSectionResult.data.data;

  if (sections.length !== initialResp.totalCount) {
    emitter?.emit("warn", {
      message: `section count mismatch, expected: ${initialResp.totalCount} received: ${rawSections.length}`,
    });
  }

  emitter?.emit("scrape:sections:done", { count: sections.length });

  return sections;
}

// getAuthCookies get a bunch of cookies from the banner api. A cookie is required
// to access the search pages - by getting a bunch, we can fire a bunch
// of concurrent requests
async function getAuthCookies(term: string, count: number) {
  const promises = Array.from({ length: count }, () =>
    fetch("https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UT",
      },
      body: `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
    }),
  );

  const results = await Promise.allSettled<Promise<Response>>(promises);

  const cookies = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => {
      const setCookies = result.value.headers.getSetCookie();
      const cookiePairs = setCookies.map((cookie) => {
        return cookie.split(";")[0].trim();
      });

      return cookiePairs.join("; ");
    });

  return cookies;
}
