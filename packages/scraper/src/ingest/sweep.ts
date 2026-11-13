/** Step 1 - the cheap read: every section Banner lists for the term. */

import type { z } from "zod";
import type { BannerSection } from "../schemas/banner/section";
import type { BannerSubjectsResponse } from "../schemas/banner/subjects";
import type { BannerCampusesResponse } from "../schemas/banner/campuses";
import type { ScraperEventEmitter } from "../events";
import type { BannerClient } from "./client";
import { SECTION_PAGE_SIZE } from "./config";

export class SweepError extends Error {
  readonly term: string;
  readonly failures: unknown[];

  constructor(message: string, term: string, failures: unknown[]) {
    super(message, { cause: failures[0] });
    this.name = "SweepError";
    this.term = term;
    this.failures = failures;
  }
}

export interface SweepPage {
  offset: number;
  received: number;
}

export interface SweepResult {
  term: string;
  termDefinition: { code: string; description: string };
  /** deduplicated by CRN, in the order Banner returned them */
  sections: z.infer<typeof BannerSection>[];
  subjects: z.infer<typeof BannerSubjectsResponse>;
  campuses: z.infer<typeof BannerCampusesResponse>;
  /** what Banner reported the term holds */
  reportedTotal: number;
  pages: SweepPage[];
  /**
   * CRNs seen on more than one page. Pagination is not a snapshot, so rows
   * shift when sections change mid-sweep. Later pages win.
   */
  duplicates: number;
  startedAt: string;
  finishedAt: string;
}

export async function sweep(
  client: BannerClient,
  term: string,
  emitter?: ScraperEventEmitter,
): Promise<SweepResult> {
  const startedAt = new Date().toISOString();
  emitter?.emit("scrape:sections:start", { term });

  // the probe reads totalCount to size the page fan-out
  const [termDefinition, subjects, campuses, probe] = await Promise.all([
    client.termDefinition(term),
    client.subjects(term),
    client.campuses(term),
    client.searchSections(term, 0, 1),
  ]);

  const reportedTotal = probe.totalCount;
  const pageCount = Math.ceil(reportedTotal / SECTION_PAGE_SIZE);
  emitter?.emit("debug", {
    message: `${reportedTotal} sections reported across ${pageCount} page(s)`,
  });

  const requests = Array.from({ length: pageCount }, (_, page) => {
    const offset = page * SECTION_PAGE_SIZE;
    return client
      .searchSections(term, offset, SECTION_PAGE_SIZE)
      .then((result) => {
        emitter?.emit("scrape:sections:progress", {
          batch: page + 1,
          totalBatches: pageCount,
        });
        return { offset, sections: result.sections };
      });
  });

  // settle all pages so the error names every failure, not just the first
  const settled = await Promise.allSettled(requests);
  const failures = settled
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);

  if (failures.length > 0) {
    throw new SweepError(
      `${failures.length} of ${pageCount} section pages failed`,
      term,
      failures,
    );
  }

  const fulfilled = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .sort((a, b) => a.offset - b.offset);

  const byCrn = new Map<string, z.infer<typeof BannerSection>>();
  let duplicates = 0;
  const pages: SweepPage[] = [];

  for (const page of fulfilled) {
    pages.push({ offset: page.offset, received: page.sections.length });
    for (const section of page.sections) {
      if (byCrn.has(section.courseReferenceNumber)) duplicates++;
      byCrn.set(section.courseReferenceNumber, section);
    }
  }

  const sections = [...byCrn.values()];

  if (duplicates > 0) {
    emitter?.emit("warn", {
      message: `${duplicates} duplicate section(s) across pages`,
      data: { term, duplicates },
    });
  }

  if (sections.length < reportedTotal) {
    emitter?.emit("warn", {
      message: `sweep is short: ${sections.length} of ${reportedTotal} reported`,
      data: { term, received: sections.length, reportedTotal },
    });
  }

  emitter?.emit("scrape:sections:done", { count: sections.length });

  return {
    term,
    termDefinition,
    sections,
    subjects,
    campuses,
    reportedTotal,
    pages,
    duplicates,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}
