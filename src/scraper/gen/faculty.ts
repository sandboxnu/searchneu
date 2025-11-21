import { logger } from "@/lib/logger";
import type { Section } from "../types";
import { decode } from "he";
import { $fetch, processWithConcurrency } from "./fetch";
import { sectionFacultyEndpoint } from "./endpoints";
import { RateLimitedFetchEngine } from "./engine";

/**
 * scrapeFaculty scrapes the faculty information
 *
 * @param term Term to scrape
 * @param sections Sections to scrape for
 * @param concurrencyLimit Number of concurrent requests to run
 * @param concurrencySettings Configuration for the
 */
export async function scrapeFaculty(
  term: string,
  sections: Section[],
  fe: RateLimitedFetchEngine,
) {
  if (sections.length === 0) {
    return;
  }

  // create a promise for each section with retry logic
  const fetchPromises = sections.map((s) => {
    const url = sectionFacultyEndpoint(term, s.crn);
    return {
      url,
      context: {
        type: "section faculty",
        crn: s.crn,
      },
      transform: (data: string) => {
        const json = JSON.parse(data);
        if (!json?.fmt?.length || !json.fmt[0]?.faculty?.length) return "TBA";

        return (
          decode(decode(json.fmt[0].faculty[0].displayName ?? "TBA")) ?? "TBA"
        );
      },
    };
  });

  const results = await fe.fetchBatchCustom(fetchPromises);

  for (const { data, success } of results) {
    if (!success) {
      section.faculty = "TBA";
      continue;
    }

    section.faculty =
      decode(decode(data.fmt[0].faculty[0].displayName)) ?? "TBA";
  }
}
