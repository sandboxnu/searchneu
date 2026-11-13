import { afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";

import { execute } from "./execute";
import { BannerClient } from "../client";
import { assemble } from "../assemble";
import { meetingsFaculty, snapshotOf, TEST_TERM } from "../testing";
import type { TermSnapshot } from "../../schemas/scraper/snapshot";

const BASE = "https://nubanner.neu.edu";
const RESULTS = "/StudentRegistrationSsb/ssb/searchResults";
const SUBJECTS = [{ code: "CS", description: "Computer Science" }];

function client() {
  return new BannerClient({
    initialRetryDelayMs: 1,
    maxRetryDelayMs: 2,
    maxRetries: 1,
  });
}

/** Every section of `register` is due. */
function allDue(snapshot: TermSnapshot, register: string) {
  return [{ register, sections: snapshot.sections[register] }];
}

const ada = {
  bannerId: "1",
  category: "01",
  class: "f",
  courseReferenceNumber: "70001",
  displayName: "Lovelace, Ada",
  emailAddress: "a@northeastern.edu",
  primaryIndicator: true,
  term: TEST_TERM,
};

/** Banner answering every request a one-section course scrape makes. */
function mockCourse(
  overrides: {
    title?: string;
    description?: string;
    prereqs?: string;
    faculty?: (typeof ada)[];
  } = {},
) {
  nock(BASE)
    .post(`${RESULTS}/getSectionCatalogDetails`)
    .reply(200, `Title: ${overrides.title ?? "Fundamentals 1"}`)
    .post(`${RESULTS}/getCourseDescription`)
    .reply(200, overrides.description ?? "<p>A course.</p>")
    .post(`${RESULTS}/getSectionPrerequisites`)
    .reply(200, overrides.prereqs ?? "")
    .post(`${RESULTS}/getCorequisites`)
    .reply(200, "")
    .get(`${RESULTS}/getFacultyMeetingTimes`)
    .query(true)
    .reply(200, {
      fmt: [{ ...meetingsFaculty("70001"), faculty: overrides.faculty ?? [] }],
    });
}

before(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});

describe("execute", () => {
  test("reads a course's detail and its section's faculty together", async () => {
    mockCourse({
      title: "Fundamentals of Computer Science 1",
      description: "\n<p>Covers lists &amp;amp; trees.</p>\n",
      // Banner's prerequisite table is nine columns wide:
      // and/or, open paren, test, score, subject, number, grade, _, close paren
      prereqs: `<table><tbody>
         <tr><td></td><td></td><td></td><td></td><td>Computer Science</td><td>1800</td><td>D-</td><td></td><td></td></tr>
       </tbody></table>`,
      faculty: [ada],
    });
    const snapshot = assemble(snapshotOf.ordinary());

    const { courses, failures } = await execute(
      client(),
      TEST_TERM,
      snapshot,
      allDue(snapshot, "CS2500"),
      SUBJECTS,
    );

    assert.deepEqual(failures, []);
    assert.deepEqual(courses, [
      {
        register: "CS2500",
        name: "Fundamentals of Computer Science 1",
        description: "Covers lists & trees.",
        prereqs: { subject: "CS", courseNumber: "1800" },
        coreqs: {},
        sections: [
          {
            crn: "70001",
            faculty: [
              {
                displayName: "Lovelace, Ada",
                email: "a@northeastern.edu",
                primary: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  test("falls back when the catalog page carries no title", async () => {
    mockCourse({ title: "" });
    const snapshot = assemble(snapshotOf.ordinary());

    const { courses } = await execute(
      client(),
      TEST_TERM,
      snapshot,
      allDue(snapshot, "CS2500"),
      SUBJECTS,
    );

    assert.equal(courses[0].name, "Unknown");
  });

  test("deduplicates faculty across meeting times", async () => {
    const grace = {
      ...ada,
      bannerId: "2",
      displayName: "Hopper, Grace",
      primaryIndicator: false,
    };
    nock(BASE)
      .post(`${RESULTS}/getSectionCatalogDetails`)
      .reply(200, "Title: Fundamentals 1")
      .post(`${RESULTS}/getCourseDescription`)
      .reply(200, "")
      .post(`${RESULTS}/getSectionPrerequisites`)
      .reply(200, "")
      .post(`${RESULTS}/getCorequisites`)
      .reply(200, "")
      .get(`${RESULTS}/getFacultyMeetingTimes`)
      .query(true)
      .reply(200, {
        fmt: [
          { ...meetingsFaculty("70001"), faculty: [ada] },
          { ...meetingsFaculty("70001"), faculty: [ada, grace] },
        ],
      });
    const snapshot = assemble(snapshotOf.ordinary());

    const { courses } = await execute(
      client(),
      TEST_TERM,
      snapshot,
      allDue(snapshot, "CS2500"),
      SUBJECTS,
    );

    assert.deepEqual(
      courses[0].sections[0].faculty.map((f) => f.displayName),
      ["Lovelace, Ada", "Hopper, Grace"],
    );
  });

  test("reads special topics detail per section", async () => {
    const snapshot = assemble(snapshotOf.specialTopics());
    nock(BASE)
      .post(`${RESULTS}/getSectionCatalogDetails`)
      .reply(200, "Title: Special Topics in Compilers")
      .post(`${RESULTS}/getCourseDescription`)
      .times(2)
      .reply(200, "<p>A topic.</p>")
      .post(`${RESULTS}/getSectionPrerequisites`)
      .times(2)
      .reply(200, "")
      .post(`${RESULTS}/getCorequisites`)
      .times(2)
      .reply(200, "")
      .get(`${RESULTS}/getFacultyMeetingTimes`)
      .query(true)
      .times(2)
      .reply(200, { fmt: [] });

    const { courses, failures } = await execute(
      client(),
      TEST_TERM,
      snapshot,
      allDue(snapshot, "CS4950"),
      SUBJECTS,
    );

    assert.deepEqual(failures, []);
    // the course itself carries no description, as in v5
    assert.equal(courses[0].description, "");
    assert.deepEqual(
      courses[0].sections.map((s) => [s.crn, s.description]),
      [
        ["70001", "A topic."],
        ["70002", "A topic."],
      ],
    );
  });

  test("drops the whole course when any of its requests fails", async () => {
    nock(BASE)
      .post(`${RESULTS}/getSectionCatalogDetails`)
      .reply(200, "Title: Fundamentals 1")
      .post(`${RESULTS}/getCourseDescription`)
      .times(2)
      .reply(503, "unavailable")
      .post(`${RESULTS}/getSectionPrerequisites`)
      .reply(200, "")
      .post(`${RESULTS}/getCorequisites`)
      .reply(200, "")
      .get(`${RESULTS}/getFacultyMeetingTimes`)
      .query(true)
      .reply(200, { fmt: [] });
    const snapshot = assemble(snapshotOf.ordinary());

    const { courses, failures } = await execute(
      client(),
      TEST_TERM,
      snapshot,
      allDue(snapshot, "CS2500"),
      SUBJECTS,
    );

    assert.deepEqual(courses, []);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].register, "CS2500");
    assert.match(failures[0].message, /failed after 2 attempts/);
  });
});
