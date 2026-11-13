import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { hydrate } from "./hydrate";
import { assemble } from "../assemble";
import { bannerSection, sweepOf } from "../testing";
import { courseRow, termState } from "./testing";

const snapshot = () =>
  assemble(sweepOf([bannerSection({ courseReferenceNumber: "70001" })]));

describe("hydrate", () => {
  test("restores course detail the catalog already holds", () => {
    const hydrated = hydrate(
      snapshot(),
      termState({
        parts: [
          {
            courses: [
              courseRow({
                description: "A real description.",
                prereqs: { subject: "CS", courseNumber: "1800" },
              }),
            ],
          },
        ],
      }),
    );

    const course = hydrated.courses[0];
    assert.equal(course.description, "A real description.");
    assert.deepEqual(course.prereqs, { subject: "CS", courseNumber: "1800" });
  });

  test("leaves sweep-derived fields alone", () => {
    const before = snapshot();
    const hydrated = hydrate(
      before,
      termState({
        parts: [{ courses: [courseRow({ minCredits: "1", maxCredits: "1" })] }],
      }),
    );

    // credits come from the sweep, so the row must not win
    assert.equal(hydrated.courses[0].minCredits, before.courses[0].minCredits);
  });
});
