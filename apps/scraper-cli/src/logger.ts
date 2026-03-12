/**
 * Wires scraper events to consola output for the CLI.
 */

import { consola } from "consola";
import type { ScraperEventEmitter } from "@sneu/scraper/events";

export function attachLogger(
  emitter: ScraperEventEmitter,
  opts: { interactive?: boolean; verbose?: boolean; veryVerbose?: boolean },
) {
  if (opts.verbose) consola.level = 4;
  if (opts.veryVerbose) consola.level = 999;

  // scrape lifecycle
  emitter.on("scrape:start", ({ term }) => {
    consola.start(`scraping term ${term}`);
  });

  emitter.on("scrape:sections:start", ({ term }) => {
    consola.start(`scraping sections for ${term}`);
  });

  emitter.on("scrape:sections:done", ({ count }) => {
    consola.success(`scraped ${count} sections`);
  });

  emitter.on("scrape:subjects:start", () => {
    consola.debug("scraping subjects");
  });

  emitter.on("scrape:subjects:done", ({ count }) => {
    consola.debug(`scraped ${count} subjects`);
  });

  emitter.on("scrape:subjects:mismatch", ({ bannerCount, extractedCount, diff }) => {
    consola.warn(
      `subject count mismatch, banner: ${bannerCount} extracted: ${extractedCount} diff: ${diff}`,
    );
  });

  emitter.on("scrape:term-definition:start", () => {
    consola.debug("scraping term definition");
  });

  emitter.on("scrape:term-definition:done", ({ code, description }) => {
    consola.debug(`term: ${code} - ${description}`);
  });

  emitter.on("scrape:stats", (stats) => {
    if (opts.interactive) {
      consola.box(
        `==scraping stats==
total:
  courses: ${stats.totalCourses}
  sections: ${stats.totalSections}
standard:
  courses: ${stats.ordinaryCourses}
  sections: ${stats.ordinarySections}
special topics:
  courses: ${stats.specialTopicsCourses}
  sections: ${stats.specialTopicsSections}
requests:
  total: ${stats.totalRequests}
  etr: ${stats.estimatedMinutes}mins`,
      );
    }
  });

  emitter.on("scrape:detail:start", () => {
    consola.start("scraping supporting information");
  });

  emitter.on("scrape:detail:progress", ({ remaining, percent, active }) => {
    if (opts.interactive) {
      consola.info(
        `${remaining} remaining (${percent}%) (${active} active)`,
      );
    }
  });

  emitter.on("scrape:detail:done", () => {
    consola.debug("detail scraping complete");
  });

  emitter.on("scrape:done", ({ term }) => {
    consola.success(`scraped term ${term}`);
  });

  // upload lifecycle
  emitter.on("upload:start", ({ term }) => {
    consola.start(`uploading term ${term}`);
  });

  emitter.on("upload:progress", ({ step }) => {
    consola.debug(`inserted ${step}`);
  });

  emitter.on("upload:sections-to-remove", ({ count }) => {
    consola.info(`${count} sections to remove`);
  });

  emitter.on("upload:meeting-times-to-remove", ({ count }) => {
    consola.info(`${count} meeting times to remove`);
  });

  emitter.on("upload:done", ({ term }) => {
    consola.success(`uploaded term ${term}`);
  });

  // warnings & errors
  emitter.on("warn", ({ message, data }) => {
    consola.warn(message, data ?? "");
  });

  emitter.on("error", ({ message, data }) => {
    consola.error(message, data ?? "");
  });

  // debug / trace
  emitter.on("debug", ({ message, data }) => {
    consola.debug(message, data ?? "");
  });

  emitter.on("trace", ({ message, data }) => {
    consola.trace(message, data ?? "");
  });

  // fetch events
  emitter.on("fetch:retry", ({ crn, step, attempt }) => {
    consola.debug(`retrying ${step} for ${crn}`, { attempt });
  });

  emitter.on("fetch:error", ({ crn, step, message }) => {
    consola.error(`error ${step} for ${crn}: ${message}`);
  });
}
