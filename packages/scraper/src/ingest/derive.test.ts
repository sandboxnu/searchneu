import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { derive } from "./derive";
import { assemble } from "./assemble";
import { bannerSection, sweepOf } from "./testing";
import type { TermSnapshot } from "../schemas/scraper/snapshot";

function withPrereqs(
  prereqs: Record<string, TermSnapshot["courses"][number]["prereqs"]>,
): TermSnapshot {
  const snapshot = assemble(
    sweepOf([
      bannerSection({ courseReferenceNumber: "70001", courseNumber: "2500" }),
      bannerSection({ courseReferenceNumber: "70002", courseNumber: "3000" }),
      bannerSection({ courseReferenceNumber: "70003", courseNumber: "4500" }),
    ]),
  );

  return {
    ...snapshot,
    courses: snapshot.courses.map((course) => ({
      ...course,
      prereqs: prereqs[course.courseNumber] ?? {},
    })),
  };
}

function postreqsOf(snapshot: TermSnapshot, courseNumber: string) {
  return snapshot.courses.find((c) => c.courseNumber === courseNumber)
    ?.postreqs;
}

describe("derive", () => {
  test("inverts a prerequisite into a postrequisite", () => {
    const derived = derive(
      withPrereqs({ "3000": { subject: "CS", courseNumber: "2500" } }),
    );

    assert.deepEqual(postreqsOf(derived, "2500"), {
      type: "and",
      items: [{ subject: "CS", courseNumber: "3000" }],
    });
    assert.deepEqual(postreqsOf(derived, "3000"), {});
  });

  test("reaches courses nested inside and/or conditions", () => {
    const derived = derive(
      withPrereqs({
        "4500": {
          type: "and",
          items: [
            { subject: "CS", courseNumber: "2500" },
            {
              type: "or",
              items: [{ subject: "CS", courseNumber: "3000" }],
            },
          ],
        },
      }),
    );

    assert.deepEqual(postreqsOf(derived, "2500"), {
      type: "and",
      items: [{ subject: "CS", courseNumber: "4500" }],
    });
    assert.deepEqual(postreqsOf(derived, "3000"), {
      type: "and",
      items: [{ subject: "CS", courseNumber: "4500" }],
    });
  });

  test("collects every course that depends on one prerequisite", () => {
    const derived = derive(
      withPrereqs({
        "3000": { subject: "CS", courseNumber: "2500" },
        "4500": { subject: "CS", courseNumber: "2500" },
      }),
    );

    assert.deepEqual(postreqsOf(derived, "2500"), {
      type: "and",
      items: [
        { subject: "CS", courseNumber: "3000" },
        { subject: "CS", courseNumber: "4500" },
      ],
    });
  });

  test("promotes a course whose fetched title says special topics", () => {
    const snapshot = assemble(
      sweepOf([bannerSection({ courseNumber: "4970" })]),
    );
    const titled: TermSnapshot = {
      ...snapshot,
      courses: snapshot.courses.map((c) => ({
        ...c,
        name: "Special Topics in Computer Science",
      })),
    };

    assert.equal(snapshot.courses[0].specialTopics, false);
    assert.equal(derive(titled).courses[0].specialTopics, true);
  });
});
