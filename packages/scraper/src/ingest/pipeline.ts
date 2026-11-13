/** Steps 1-6: Banner into a finished TermSnapshot, scraping every course. */

import type { TermSnapshot } from "../schemas/scraper/snapshot";
import type { ScraperEventEmitter } from "../events";
import type { BannerClient } from "./client";
import { sweep, type SweepResult } from "./sweep";
import { assemble } from "./assemble";
import { derive } from "./derive";
import { execute, type ExecuteResult } from "./details/execute";
import { applyScrapes } from "./details/patch";

export interface SnapshotRun {
  snapshot: TermSnapshot;
  sweep: SweepResult;
  details: ExecuteResult;
}

export async function buildSnapshot(
  client: BannerClient,
  term: string,
  options: { emitter?: ScraperEventEmitter } = {},
): Promise<SnapshotRun> {
  const emitter = options.emitter;

  emitter?.emit("scrape:start", { term });

  const swept = await sweep(client, term, emitter);
  const assembled = assemble(swept);

  const due = assembled.courses.map((course) => {
    const register = course.subject + course.courseNumber;
    return { register, sections: assembled.sections[register] ?? [] };
  });

  emitter?.emit("scrape:detail:start");
  const details = await execute(
    client,
    term,
    assembled,
    due,
    assembled.subjects,
    emitter,
  );
  emitter?.emit("scrape:detail:done");

  const snapshot = derive(applyScrapes(assembled, details));
  emitter?.emit("scrape:done", { term });

  return { snapshot, sweep: swept, details };
}
