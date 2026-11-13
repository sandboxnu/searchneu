import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { plan, type PassKind } from "./plan";
import { dueCourses } from "../details/due";
import { TOMBSTONE } from "../config";
import { assemble } from "../assemble";
import { bannerSection, sweepOf } from "../testing";
import { courseRow, sectionRow, termState } from "./testing";
import type { TermState } from "./state";
import type { TermSnapshot } from "../../schemas/scraper/snapshot";

const NOW = new Date("2026-07-15T00:00:00.000Z");

/** Summer A's add/drop deadline has passed; Full and B are still open. */
const DEADLINES = {
  "1": new Date("2026-10-01T00:00:00.000Z"),
  "2A": new Date("2026-05-20T00:00:00.000Z"),
  "2B": new Date("2026-08-01T00:00:00.000Z"),
};

/**
 * Banner serves all three sessions under one term code forever, including
 * the one that has finished.
 */
function summerSweep(crns = ["60001", "60002", "60003"]) {
  const byPart: Record<string, { part: string; number: string }> = {
    "60001": { part: "1", number: "2500" },
    "60002": { part: "2A", number: "3000" },
    "60003": { part: "2B", number: "4000" },
  };

  return sweepOf(
    crns.map((crn) =>
      bannerSection({
        courseReferenceNumber: crn,
        partOfTerm: byPart[crn].part,
        courseNumber: byPart[crn].number,
      }),
    ),
  );
}

function snapshotOf(crns?: string[]): TermSnapshot {
  return assemble(summerSweep(crns));
}

/** The whole summer as the catalog holds it, before any freeze filter. */
function summerState(): TermState {
  return termState({
    parts: [
      {
        partOfTerm: "1",
        termId: 1,
        name: "Summer 2026 - Full",
        activeUntil: DEADLINES["1"],
        courses: [courseRow({ id: 101, termId: 1, register: "CS2500" })],
        sections: [
          sectionRow({ id: 201, termId: 1, courseId: 101, crn: "60001" }),
        ],
      },
      {
        partOfTerm: "2A",
        termId: 2,
        name: "Summer 2026 - Session A",
        activeUntil: DEADLINES["2A"],
        courses: [courseRow({ id: 102, termId: 2, register: "CS3000" })],
        sections: [
          sectionRow({
            id: 202,
            termId: 2,
            courseId: 102,
            crn: "60002",
            seatRemaining: 0,
          }),
        ],
      },
      {
        partOfTerm: "2B",
        termId: 3,
        name: "Summer 2026 - Session B",
        activeUntil: DEADLINES["2B"],
        courses: [courseRow({ id: 103, termId: 3, register: "CS4000" })],
        sections: [
          sectionRow({
            id: 203,
            termId: 3,
            courseId: 103,
            crn: "60003",
            seatRemaining: 0,
          }),
        ],
      },
    ],
    lookups: { subjects: new Map([["CS", 1]]) },
  });
}

/** What the caller does before handing state to `plan`. */
function liveOnly(state: TermState, now: Date): TermState {
  return {
    ...state,
    parts: new Map(
      [...state.parts].filter(([, part]) => part.term.activeUntil > now),
    ),
  };
}

function run(
  snapshot: TermSnapshot,
  state: TermState,
  pass: PassKind = "light",
) {
  const parts = [...state.parts.values()];
  // a deep plan here writes every course, as if each had been scraped
  const scraped = new Set(
    snapshot.courses.map((c) => c.subject + c.courseNumber),
  );
  return plan(
    snapshot,
    state,
    {
      name: parts[0]?.term.name ?? "Summer 2026",
      activeUntil: parts[0]?.term.activeUntil ?? DEADLINES["1"],
      splitByPartOfTerm: true,
      parts: parts.map((p) => ({
        code: p.term.partOfTerm,
        name: p.term.name,
        activeUntil: p.term.activeUntil,
      })),
    },
    { pass, now: NOW, tombstone: TOMBSTONE, scraped },
  );
}

describe("parts of term", () => {
  test("keeps each part's own name and never writes a term row", () => {
    const result = run(snapshotOf(), liveOnly(summerState(), NOW));

    assert.deepEqual(
      result.parts.map((p) => p.termRow.name),
      ["Summer 2026 - Full", "Summer 2026 - Session B"],
    );
    assert.deepEqual(
      result.parts.map((p) => p.termRow.op),
      ["noop", "noop"],
    );
  });

  test("freezes a finished session Banner is still serving", () => {
    // Summer A's seats differ from the catalog, and must stay that way
    const result = run(snapshotOf(), liveOnly(summerState(), NOW));

    assert.deepEqual(
      result.parts.flatMap((p) => p.sections.update.map((u) => u.crn)),
      ["60003"],
    );
  });

  test("keeps a frozen part out of the stats and the tombstone pass", () => {
    const result = run(snapshotOf(), liveOnly(summerState(), NOW));

    // two live sections considered, not the three Banner returned
    assert.equal(result.stats.snapshotSections, 2);
    assert.equal(result.stats.stateSections, 2);
    assert.equal(result.stats.missingSections, 0);
    assert.deepEqual(
      result.parts.flatMap((p) => p.tombstones.sections),
      [],
    );
  });

  test("still marks a live part's section that Banner dropped", () => {
    const result = run(
      snapshotOf(["60001", "60002"]),
      liveOnly(summerState(), NOW),
    );

    assert.deepEqual(
      result.parts.flatMap((p) =>
        p.tombstones.sections.map((t) => [p.partOfTerm, t.key, t.action]),
      ),
      [["2B", "60003", "mark"]],
    );
  });

  test("does not plan a part code the manifest has never heard of", () => {
    const sweep = sweepOf([
      bannerSection({ courseReferenceNumber: "60001", partOfTerm: "1" }),
      bannerSection({
        courseReferenceNumber: "60004",
        courseNumber: "5000",
        partOfTerm: "2C",
      }),
    ]);

    const result = run(assemble(sweep), liveOnly(summerState(), NOW), "deep");
    assert.deepEqual(
      result.parts.flatMap((p) => p.sections.insert.map((s) => s.crn)),
      [],
    );
  });

  test("does not scrape a frozen part's courses", () => {
    // every row is older than the TTL, so only freezing can hold one back
    const due = dueCourses(
      assemble(summerSweep()),
      liveOnly(summerState(), NOW),
      { now: NOW, ttlMs: 0, budget: Infinity, split: true },
    );

    assert.deepEqual(due.flatMap((d) => d.sections.map((s) => s.crn)).sort(), [
      "60001",
      "60003",
    ]);
  });
});
