import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { filterScrapeByPartOfTerm } from "./main";

function makeSection(overrides: Record<string, unknown> = {}) {
  return {
    crn: "10001",
    name: "Test Section",
    description: "A test section",
    sectionNumber: "01",
    partOfTerm: "1",
    seatCapacity: 50,
    seatRemaining: 10,
    waitlistCapacity: 10,
    waitlistRemaining: 5,
    classType: "Lecture",
    honors: false,
    campus: "Boston",
    meetingTimes: [],
    faculty: [],
    xlist: [],
    coreqs: {},
    prereqs: {},
    ...overrides,
  };
}

function makeScrape(
  courses: Array<{
    subject: string;
    courseNumber: string;
    name?: string;
  }>,
  sections: Record<string, Array<ReturnType<typeof makeSection>>>,
) {
  return {
    version: 5 as const,
    timestamp: "2025-01-01T00:00:00Z",
    term: { code: "202510", description: "Spring 2025" },
    courses: courses.map((c) => ({
      subject: c.subject,
      courseNumber: c.courseNumber,
      specialTopics: false,
      name: c.name ?? "Test Course",
      description: "A test course",
      maxCredits: 4,
      minCredits: 4,
      attributes: [],
      coreqs: {},
      prereqs: {},
      postreqs: {},
    })),
    sections,
    attributes: [],
    subjects: [],
    campuses: [],
  };
}

describe("filterScrapeByPartOfTerm", () => {
  test("filters sections by partOfTerm value", () => {
    const scrape = makeScrape(
      [{ subject: "CS", courseNumber: "2500" }],
      {
        CS2500: [
          makeSection({ crn: "10001", partOfTerm: "1" }),
          makeSection({ crn: "10002", partOfTerm: "A" }),
        ],
      },
    );

    const result = filterScrapeByPartOfTerm(scrape, "1");

    assert.equal(result.sections["CS2500"].length, 1);
    assert.equal(result.sections["CS2500"][0].crn, "10001");
  });

  test("removes courses with no matching sections", () => {
    const scrape = makeScrape(
      [
        { subject: "CS", courseNumber: "2500" },
        { subject: "CS", courseNumber: "2510" },
      ],
      {
        CS2500: [makeSection({ crn: "10001", partOfTerm: "A" })],
        CS2510: [makeSection({ crn: "10002", partOfTerm: "B" })],
      },
    );

    const result = filterScrapeByPartOfTerm(scrape, "A");

    assert.equal(result.courses.length, 1);
    assert.equal(result.courses[0].subject, "CS");
    assert.equal(result.courses[0].courseNumber, "2500");
    assert.equal(result.sections["CS2510"], undefined);
  });

  test("keeps courses that have at least one matching section", () => {
    const scrape = makeScrape(
      [{ subject: "CS", courseNumber: "2500" }],
      {
        CS2500: [
          makeSection({ crn: "10001", partOfTerm: "1" }),
          makeSection({ crn: "10002", partOfTerm: "A" }),
          makeSection({ crn: "10003", partOfTerm: "1" }),
        ],
      },
    );

    const result = filterScrapeByPartOfTerm(scrape, "1");

    assert.equal(result.courses.length, 1);
    assert.equal(result.sections["CS2500"].length, 2);
  });

  test("all sections match: returns equivalent scrape", () => {
    const scrape = makeScrape(
      [{ subject: "CS", courseNumber: "2500" }],
      {
        CS2500: [
          makeSection({ crn: "10001", partOfTerm: "1" }),
          makeSection({ crn: "10002", partOfTerm: "1" }),
        ],
      },
    );

    const result = filterScrapeByPartOfTerm(scrape, "1");

    assert.equal(result.courses.length, 1);
    assert.equal(result.sections["CS2500"].length, 2);
  });

  test("no sections match: returns empty courses and sections", () => {
    const scrape = makeScrape(
      [{ subject: "CS", courseNumber: "2500" }],
      {
        CS2500: [
          makeSection({ crn: "10001", partOfTerm: "A" }),
          makeSection({ crn: "10002", partOfTerm: "B" }),
        ],
      },
    );

    const result = filterScrapeByPartOfTerm(scrape, "1");

    assert.equal(result.courses.length, 0);
    assert.deepStrictEqual(result.sections, {});
  });

  test("does not mutate the original scrape object", () => {
    const scrape = makeScrape(
      [
        { subject: "CS", courseNumber: "2500" },
        { subject: "CS", courseNumber: "2510" },
      ],
      {
        CS2500: [
          makeSection({ crn: "10001", partOfTerm: "1" }),
          makeSection({ crn: "10002", partOfTerm: "A" }),
        ],
        CS2510: [makeSection({ crn: "10003", partOfTerm: "A" })],
      },
    );

    const originalCourseCount = scrape.courses.length;
    const originalCS2500Count = scrape.sections["CS2500"].length;
    const originalCS2510Count = scrape.sections["CS2510"].length;

    filterScrapeByPartOfTerm(scrape, "1");

    assert.equal(scrape.courses.length, originalCourseCount);
    assert.equal(scrape.sections["CS2500"].length, originalCS2500Count);
    assert.equal(scrape.sections["CS2510"].length, originalCS2510Count);
  });
});
