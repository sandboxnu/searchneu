/**
 * Wires scraper events to clack output for the CLI.
 */
import { p, pc, isVerbose, isTrace } from "./ui";
import type { ScraperEventEmitter } from "@sneu/scraper/events";

export function attachLogger(
  emitter: ScraperEventEmitter,
  opts: { interactive?: boolean },
) {
  const s = p.spinner();

  // ── config lifecycle ──────────────────────────────────────
  emitter.on("config:start", () => {
    s.start("Generating static config");
  });

  emitter.on("config:load-caches", ({ count }) => {
    p.log.info(
      `Loaded ${pc.bold(String(count))} cache file${count !== 1 ? "s" : ""}`,
    );
  });

  emitter.on("config:merge:campuses", ({ added, total }) => {
    if (isVerbose())
      p.log.info(pc.dim(`campuses: ${total} total (+${added} new)`));
  });

  emitter.on("config:merge:buildings", ({ added, total }) => {
    if (isVerbose())
      p.log.info(pc.dim(`buildings: ${total} total (+${added} new)`));
  });

  emitter.on("config:merge:subjects", ({ added, total }) => {
    if (isVerbose())
      p.log.info(pc.dim(`subjects: ${total} total (+${added} new)`));
  });

  emitter.on("config:merge:terms", ({ added, total }) => {
    if (isVerbose())
      p.log.info(pc.dim(`terms: ${total} total (+${added} new)`));
  });

  emitter.on("config:done", () => {
    s.stop("Config generated");
  });

  // ── scrape lifecycle ──────────────────────────────────────
  emitter.on("scrape:start", ({ term }) => {
    s.start(`Scraping term ${pc.cyan(term)}`);
  });

  emitter.on("scrape:sections:start", ({ term }) => {
    s.start(`Fetching sections for ${pc.cyan(term)}`);
  });

  emitter.on("scrape:sections:done", ({ count }) => {
    s.stop(`Fetched ${pc.bold(String(count))} sections`);
  });

  emitter.on("scrape:subjects:start", () => {
    if (isVerbose()) p.log.info(pc.dim("Fetching subjects"));
  });

  emitter.on("scrape:subjects:done", ({ count }) => {
    if (isVerbose()) p.log.info(pc.dim(`Fetched ${count} subjects`));
  });

  emitter.on("scrape:term-definition:start", () => {
    if (isVerbose()) p.log.info(pc.dim("Fetching term definition"));
  });

  emitter.on("scrape:term-definition:done", ({ code, description }) => {
    if (isVerbose()) p.log.info(pc.dim(`Term: ${code} — ${description}`));
  });

  emitter.on("scrape:stats", (stats) => {
    if (opts.interactive) {
      p.note(
        [
          pc.bold("Total"),
          `  Courses:   ${pc.cyan(String(stats.totalCourses))}`,
          `  Sections:  ${pc.cyan(String(stats.totalSections))}`,
          "",
          pc.bold("Standard"),
          `  Courses:   ${stats.ordinaryCourses}`,
          `  Sections:  ${stats.ordinarySections}`,
          "",
          pc.bold("Special Topics"),
          `  Courses:   ${stats.specialTopicsCourses}`,
          `  Sections:  ${stats.specialTopicsSections}`,
          "",
          pc.bold("Requests"),
          `  Total:     ${stats.totalRequests}`,
          `  ETR:       ${pc.yellow(String(stats.estimatedMinutes))} mins`,
        ].join("\n"),
        "Scrape Stats",
      );
    }
  });

  emitter.on("scrape:detail:start", () => {
    s.start("Fetching course details");
  });

  emitter.on("scrape:detail:progress", ({ remaining, percent, active }) => {
    if (opts.interactive) {
      s.message(
        `${remaining} remaining ${pc.dim(`(${percent}%)`)} · ${active} active`,
      );
    }
  });

  emitter.on("scrape:detail:done", () => {
    s.stop("Course details fetched");
  });

  emitter.on("scrape:done", ({ term }) => {
    p.log.success(`Term ${pc.cyan(term)} scraped`);
  });

  // ── upload lifecycle ──────────────────────────────────────
  emitter.on("upload:start", ({ term }) => {
    s.start(`Uploading term ${pc.cyan(term)}`);
  });

  emitter.on("upload:progress", ({ step }) => {
    if (isVerbose()) s.message(`Inserting ${step}`);
  });

  emitter.on("upload:sections-to-remove", ({ count }) => {
    p.log.info(`${count} sections to remove`);
  });

  emitter.on("upload:meeting-times-to-remove", ({ count }) => {
    p.log.info(`${count} meeting times to remove`);
  });

  emitter.on("upload:done", ({ term, part }) => {
    s.stop(`Term ${pc.cyan(term)}|${pc.cyan(part)} uploaded`);
  });

  // ── warnings & errors ─────────────────────────────────────
  emitter.on("warn", ({ message, data }) => {
    p.log.warning(message + (data ? ` ${String(data)}` : ""));
  });

  emitter.on("error", ({ message, data }) => {
    p.log.error(pc.red(message + (data ? ` ${String(data)}` : "")));
  });

  // ── debug / trace ─────────────────────────────────────────
  emitter.on("debug", ({ message, data }) => {
    // if (isVerbose())
    //   p.log.info(pc.dim(message + (data ? ` ${String(data)}` : "")));
    if (isVerbose())
      s.message(pc.dim(message + (data ? ` ${String(data)}` : "")));
  });

  emitter.on("trace", ({ message, data }) => {
    if (isTrace())
      p.log.message(pc.dim(message + (data ? ` ${String(data)}` : "")));
  });

  // ── fetch events ──────────────────────────────────────────
  emitter.on("fetch:retry", ({ crn, step, attempt }) => {
    if (isVerbose()) {
      p.log.info(pc.dim(`Retrying ${step} for ${crn} (attempt ${attempt})`));
    }
  });

  emitter.on("fetch:error", ({ crn, step, message }) => {
    p.log.error(pc.red(`${step} failed for ${crn}: ${message}`));
  });
}
