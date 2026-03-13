import type { Faculty, Section } from "../../types";
import { FetchEngine } from "../fetch";
import { sectionFacultyEndpoint } from "../endpoints";
import { consola } from "consola";
import { decode } from "html-entities";
import { BannerSectionMeetingsFacultyResponse } from "../../schemas/banner/meetingsFaculty";
import z from "zod";

/**
 * scrapeMeetingsFaculty scrapes the faculty. the endpoint returns nearly identical information as the
 * `meetingsFaculty` in the `sectionSearchEndpoint` but includes faculty information which the search
 * endpoint (now) hides.
 *
 * when scraping, the faculty are updated in place on the `Section` object.
 *
 * endpoint:
 * `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes`
 *
 * @param fe fetch engine to use (in order to throttle requests)
 * @param term the term to scrape from
 * @param sections list of sections. these are updated in place with the scraped information
 * @returns list of crns which failed being scraped
 */
export async function scrapeMeetingsFaculty(
  fe: FetchEngine,
  term: string,
  sections: Section[],
) {
  const failedRequests: string[] = [];
  const facultyRequests: (() => Promise<void>)[] = [];

  // create a list of async functions which fetch the faculty and add it to the section
  for (const s of sections) {
    facultyRequests.push(async () => {
      const url = sectionFacultyEndpoint(term, s.crn); // generate the endpoint to hit
      const resp = await fe
        .fetch(url, {
          onRetry(attempt) {
            // retries are part of the process, just log it if debugging
            consola.debug("retrying faculty for section", {
              crn: s.crn,
              attempt,
            });
          },
        })
        .then((r) => r.json())
        .catch((e) => {
          // if the request fails for some reason: note the crn, log the error, and skip the section
          failedRequests.push(s.crn);
          consola.error("error scraping faculty", { error: e, crn: s.crn });
          return;
        });

      // take the response and parse it - this ensures it follows the expected schema
      // and gives us types
      const meetingsFacultyResult =
        await BannerSectionMeetingsFacultyResponse.safeParseAsync(resp);

      if (!meetingsFacultyResult.success) {
        // if the parse fails: note the crn, log the error, and skip the section
        failedRequests.push(s.crn);
        consola.error("error parsing faculty", {
          error: meetingsFacultyResult.error,
          crn: s.crn,
        });
        return;
      }

      const meetingsFaculty = meetingsFacultyResult.data;

      // find all unique faculty
      const facultySet: Set<
        z.infer<
          typeof BannerSectionMeetingsFacultyResponse
        >["fmt"][0]["faculty"][0]
      > = new Set();
      meetingsFaculty.fmt.forEach((mt) => {
        mt.faculty.forEach((f) => facultySet.add(f));
      });

      const faculty = Array.from(facultySet).map(
        (f) =>
          ({
            displayName: decode(decode(f.displayName)),
            email: f.emailAddress,
            primary: f.primaryIndicator,
          }) as Faculty,
      );

      // update the section faculty in place
      s.faculty = faculty;
    });
  }

  // trigger all the scrape promises (this is the *do* step)
  const facultyPromises = facultyRequests.map((p) => p());

  // await all of the promises
  await Promise.all(facultyPromises);

  return failedRequests;
}
