import { logger } from "@/lib/logger";
import type { Course } from "../types";
import { $fetch, processWithConcurrency } from "./fetch";
import { decode } from "he";
import {
  courseNameEndpoint,
  courseDescriptionEndpoint,
  coursePrereqsEndpoint,
} from "./endpoints";

/**
 * scrapeCourseNames
 *
 * @param term Term to scrape from
 * @param courses The
 * @param concurrencyLimit Number of concurrent requests to run
 * @param concurrencySettings Configuration for the
 */
export async function scrapeCourseNames(
  term: string,
  courses: { course: Course; crn: string }[],
  concurrencyLimit: number = 20,
  concurrencySettings: Parameters<typeof $fetch>[2],
) {
  const fetchPromises = courses.map((c) => async () => {
    try {
      const [url, body] = courseNameEndpoint(term, c.crn);
      const data = await $fetch(url, body, {
        ...concurrencySettings,
        onRetry: (_, attempt) => {
          logger.debug(`retrying course w/ crn ${c.crn}, attempt ${attempt}`);
        },
      }).then((r) => r.text());

      return { course: c, data, success: true };
    } catch (error) {
      logger.error(
        {
          crn: c.crn,
          register: `${c.course.subject} ${c.course.courseNumber}`,
          error,
        },
        "failed to fetch name for course",
      );

      return { course: c, data: null, success: false };
    }
  });

  // process with concurrency limit
  const results = await processWithConcurrency(fetchPromises, concurrencyLimit);

  for (const { course, data, success } of results) {
    if (!success || !data) {
      course.course.name = "Unknown";
      continue;
    }

    course.course.name =
      decode(decode(data))
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .trim()
        .match(/^Title:(.*)$/m)?.[1]
        .trim() || "Unknown";
  }
}

/**
 * scrapeCourseDescriptions
 *
 * @param term Term to scrape from
 * @param courses The
 * @param concurrencyLimit Number of concurrent requests to run
 * @param concurrencySettings Configuration for the
 */
export async function scrapeCourseDescriptions(
  term: string,
  courses: { course: Course; crn: string }[],
  concurrencyLimit: number = 20,
  concurrencySettings: Parameters<typeof $fetch>[2],
) {
  const fetchPromises = courses.map((c) => async () => {
    try {
      const [url, body] = courseDescriptionEndpoint(term, c.crn);
      const data = await $fetch(url, body, {
        ...concurrencySettings,
        onRetry: (_, attempt) => {
          logger.debug(`retrying section ${c.crn}, attempt ${attempt}`);
        },
      }).then((r) => r.text());

      return { course: c, data, success: true };
    } catch (error) {
      logger.error(
        {
          crn: c.crn,
          register: `${c.course.subject} ${c.course.courseNumber}`,
          error,
        },
        "failed to fetch description for course",
      );

      return { course: c, data: null, success: false };
    }
  });

  // process with concurrency limit
  const results = await processWithConcurrency(fetchPromises, concurrencyLimit);

  for (const { course, data, success } of results) {
    if (!success || !data) {
      course.course.description = "";
      continue;
    }

    course.course.description =
      decode(decode(data))
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
        .trim() || "";
  }
}

/**
 * scrapeCourseReqs
 *
 * @param term Term to scrape from
 * @param courses The
 * @param concurrencyLimit Number of concurrent requests to run
 * @param concurrencySettings Configuration for the
 */
export async function scrapeCourseReqs(
  term: string,
  courses: { course: Course; crn: string }[],
  concurrencyLimit: number = 20,
  concurrencySettings: Parameters<typeof $fetch>[2],
) {
  const fetchPromises = courses.map((c) => async () => {
    try {
      const [url, body] = coursePrereqsEndpoint(term, c.crn);
      const data = await $fetch(url, body, {
        ...concurrencySettings,
        onRetry: (_, attempt) => {
          logger.debug(`retrying section ${c.crn}, attempt ${attempt}`);
        },
      }).then((r) => r.text());

      return { course: c, data, success: true };
    } catch (error) {
      logger.error(
        {
          crn: c.crn,
          register: `${c.course.subject} ${c.course.courseNumber}`,
          error,
        },
        "failed to fetch prereqs for course",
      );

      return { course: c, data: null, success: false };
    }
  });

  // process with concurrency limit
  const results = await processWithConcurrency(fetchPromises, concurrencyLimit);

  for (const { course, data, success } of results) {
    //   if (!success || !data) {
    //     course.course.description = "";
    //     continue;
    //   }
    //
    //   course.course.description =
    //     decode(decode(data))
    //       .replace(/<[^>]*>/g, "") // Remove HTML tags
    //       .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    //       .trim() || "";
    // }
    continue;
  }
}
