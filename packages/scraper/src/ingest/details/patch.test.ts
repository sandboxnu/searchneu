import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { applyScrapes } from "./patch";
import type { CourseScrape } from "./execute";
import { assemble } from "../assemble";
import { snapshotOf } from "../testing";

const scrape: CourseScrape = {
  register: "CS2500",
  name: "Fundamentals of Computer Science 1",
  description: "An introduction.",
  prereqs: { subject: "CS", courseNumber: "1800" },
  coreqs: {},
  sections: [
    {
      crn: "70001",
      faculty: [{ displayName: "Ada", email: null, primary: true }],
    },
  ],
};

describe("applyScrapes", () => {
  test("writes a scraped course and its sections' faculty", () => {
    const after = applyScrapes(assemble(snapshotOf.ordinary()), {
      courses: [scrape],
      failures: [],
    });

    const course = after.courses[0];
    assert.equal(course.name, "Fundamentals of Computer Science 1");
    assert.equal(course.description, "An introduction.");
    assert.deepEqual(course.prereqs, { subject: "CS", courseNumber: "1800" });
    assert.deepEqual(after.sections["CS2500"][0].faculty, [
      { displayName: "Ada", email: null, primary: true },
    ]);
  });

  test("keeps per-section detail for special topics", () => {
    const after = applyScrapes(assemble(snapshotOf.specialTopics()), {
      courses: [
        {
          register: "CS4950",
          name: "Special Topics in Compilers",
          description: "",
          prereqs: {},
          coreqs: {},
          sections: [
            {
              crn: "70001",
              faculty: [],
              description: "Compilers.",
              prereqs: { subject: "CS", courseNumber: "3500" },
              coreqs: {},
            },
          ],
        },
      ],
      failures: [],
    });

    const [compilers, robotics] = after.sections["CS4950"];
    assert.equal(compilers.description, "Compilers.");
    assert.deepEqual(compilers.prereqs, {
      subject: "CS",
      courseNumber: "3500",
    });
    // a section the scrape did not cover keeps what it had
    assert.equal(robotics.description, "");
  });
});
