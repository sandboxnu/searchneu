import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { dueCourses, type DueOptions } from "./due";
import { assemble } from "../assemble";
import { bannerSection, sweepOf } from "../testing";
import { courseRow, sectionRow, termState } from "../sync/testing";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-02-01T00:00:00.000Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

const options: DueOptions = {
  now: NOW,
  ttlMs: 7 * DAY,
  budget: 100,
  split: false,
};

const twoCourses = () =>
  assemble(
    sweepOf([
      bannerSection({ courseReferenceNumber: "70001" }),
      bannerSection({ courseReferenceNumber: "70002", courseNumber: "3000" }),
    ]),
  );

/** Both courses in the catalog, scraped the given number of days ago. */
function catalog(cs2500: number, cs3000: number) {
  return termState({
    parts: [
      {
        courses: [
          courseRow({ id: 100, register: "CS2500", updatedAt: ago(cs2500) }),
          courseRow({ id: 101, register: "CS3000", updatedAt: ago(cs3000) }),
        ],
        sections: [
          sectionRow({ id: 200, courseId: 100, crn: "70001" }),
          sectionRow({ id: 201, courseId: 101, crn: "70002" }),
        ],
      },
    ],
  });
}

const registers = (due: ReturnType<typeof dueCourses>) =>
  due.map((d) => d.register);

describe("dueCourses", () => {
  test("leaves a course alone until its TTL runs out", () => {
    const due = dueCourses(twoCourses(), catalog(6, 8), options);

    assert.deepEqual(registers(due), ["CS3000"]);
  });

  test("scrapes a course the catalog has never seen", () => {
    const state = catalog(1, 1);
    state.parts.get("1")!.courses.delete("CS3000");

    assert.deepEqual(registers(dueCourses(twoCourses(), state, options)), [
      "CS3000",
    ]);
  });

  test("scrapes a fresh course that gained a section", () => {
    const snapshot = assemble(
      sweepOf([
        bannerSection({ courseReferenceNumber: "70001" }),
        bannerSection({ courseReferenceNumber: "70003", sequenceNumber: "02" }),
      ]),
    );

    assert.deepEqual(registers(dueCourses(snapshot, catalog(1, 1), options)), [
      "CS2500",
    ]);
  });

  test("scrapes a course that came back after going missing", () => {
    const state = catalog(1, 1);
    const row = state.parts.get("1")!.courses.get("CS2500")!;
    row.missingSince = ago(1);

    assert.deepEqual(registers(dueCourses(twoCourses(), state, options)), [
      "CS2500",
    ]);
  });

  test("takes unseen courses first, then the oldest, up to the budget", () => {
    const state = catalog(30, 10);
    state.parts.get("1")!.sections.delete("70002");

    const due = dueCourses(twoCourses(), state, { ...options, budget: 1 });

    // CS3000 has an unseen section, so it beats CS2500's older scrape
    assert.deepEqual(registers(due), ["CS3000"]);
  });

  test("hands over the sections to read faculty for", () => {
    const due = dueCourses(twoCourses(), catalog(8, 1), options);

    assert.deepEqual(
      due[0].sections.map((s) => s.crn),
      ["70001"],
    );
  });
});
