import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { scrapeSections } from "./sections";
import { ScraperEventEmitter } from "../../events";

const BASE = "https://nubanner.neu.edu";
const AUTH_PATH = "/StudentRegistrationSsb/ssb/term/search";
const SEARCH_PATH =
  "/StudentRegistrationSsb/ssb/searchResults/searchResults";

/** Build a minimal BannerSection object that passes the strict Zod schema. */
function makeBannerSection(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    term: "202510",
    termDesc: "Spring 2025",
    courseReferenceNumber: "12345",
    partOfTerm: "1",
    courseNumber: "2500",
    subject: "CS",
    subjectDescription: "Computer Science",
    sequenceNumber: "01",
    campusDescription: "Boston",
    scheduleTypeDescription: "Lecture",
    courseTitle: "Fundamentals of Computer Science 1",
    creditHours: null,
    maximumEnrollment: 100,
    enrollment: 50,
    seatsAvailable: 50,
    waitCapacity: 0,
    waitCount: 0,
    waitAvailable: 0,
    crossList: null,
    crossListCapacity: null,
    crossListCount: null,
    crossListAvailable: null,
    creditHourHigh: null,
    creditHourLow: 4,
    creditHourIndicator: null,
    openSection: true,
    linkIdentifier: null,
    isSectionLinked: false,
    subjectCourse: "CS2500",
    faculty: [],
    meetingsFaculty: [
      {
        category: "01",
        class: "net.hedtech.banner.student.schedule.SectionSessionDecorator",
        courseReferenceNumber: "12345",
        faculty: [
          {
            bannerId: "000111222",
            category: "01",
            class:
              "net.hedtech.banner.student.schedule.SectionSessionDecorator",
            courseReferenceNumber: "12345",
            displayName: "Test Instructor",
            emailAddress: null,
            primaryIndicator: true,
            term: "202510",
          },
        ],
        meetingTime: {
          beginTime: "0935",
          building: "WVH",
          buildingDescription: "West Village H",
          campus: "BOS",
          campusDescription: "Boston",
          category: "01",
          class:
            "net.hedtech.banner.student.schedule.SectionSessionDecorator",
          courseReferenceNumber: "12345",
          creditHourSession: 4,
          endDate: "04/14/2025",
          endTime: "1040",
          friday: false,
          hoursWeek: 2.16,
          meetingScheduleType: "LEC",
          meetingType: "CLAS",
          meetingTypeDescription: "Class",
          monday: true,
          room: "210",
          saturday: false,
          startDate: "01/06/2025",
          sunday: false,
          term: "202510",
          thursday: false,
          tuesday: false,
          wednesday: true,
        },
        term: "202510",
      },
    ],
    reservedSeatSummary: null,
    sectionAttributes: [
      {
        class:
          "net.hedtech.banner.student.schedule.SectionDecorator",
        code: "NUCS",
        courseReferenceNumber: "12345",
        description: "NUpath Creative Express/Mail",
        isZTCAttribute: false,
        termCode: "202510",
      },
    ],
    instructionalMethod: null,
    instructionalMethodDescription: null,
    ...overrides,
  };
}

/** Build a valid BannerSectionResponse envelope. */
function makeSectionResponse(
  data: unknown[],
  totalCount: number,
  pageOffset = 0,
  pageMaxSize = 500,
) {
  return {
    success: true,
    totalCount,
    data,
    pageOffset,
    pageMaxSize,
    sectionsFetchedCount: data.length,
    pathMode: null,
    searchResultsConfigs: [
      {
        config: "term",
        display: "Term",
        title: "Term",
        required: true,
        width: "200",
      },
    ],
    ztcEncodedImage: "",
  };
}

/**
 * Set up nock interceptors to mock `count` auth-cookie POST requests.
 * Each returns a unique JSESSIONID cookie.
 */
function mockAuthCookies(count: number) {
  for (let i = 0; i < count; i++) {
    nock(BASE)
      .post(AUTH_PATH)
      .reply(200, "", {
        "Set-Cookie": [`JSESSIONID=cookie${i}; Path=/`],
      });
  }
}

afterEach(() => {
  nock.cleanAll();
});

describe("scrapeSections", () => {
  test("successful scrape with a small number of sections", async () => {
    const term = "202510";
    const section = makeBannerSection();
    mockAuthCookies(2);

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "1",
      })
      .reply(200, makeSectionResponse([section], 1, 0, 1));

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "500",
      })
      .reply(200, makeSectionResponse([section], 1, 0, 500));

    const result = await scrapeSections(term, undefined, 1);
    assert.ok(result);
    assert.equal(result.length, 1);
    assert.equal(result[0].courseReferenceNumber, "12345");
  });

  test("returns undefined when no auth cookies available", async () => {
    const term = "202510";

    // Both auth requests fail so allSettled yields zero cookies
    nock(BASE).post(AUTH_PATH).replyWithError("connection refused");
    nock(BASE).post(AUTH_PATH).replyWithError("connection refused");

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeSections(term, emitter, 1);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "not enough banner auth cookies");
  });

  test("returns undefined when initial section response fails to parse", async () => {
    const term = "202510";
    mockAuthCookies(2);

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "1",
      })
      .reply(200, { invalid: true });

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeSections(term, emitter, 1);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.match(
      errors[0].message,
      /error parsing initial section response/,
    );
  });

  test("section count mismatch emits warning", async () => {
    const term = "202510";
    const section = makeBannerSection();
    mockAuthCookies(2);

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "1",
      })
      .reply(200, makeSectionResponse([section], 2, 0, 1));

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "500",
      })
      .reply(200, makeSectionResponse([section], 2, 0, 500));

    const emitter = new ScraperEventEmitter();
    const warnings: { message: string }[] = [];
    emitter.on("warn", (data) => warnings.push(data));

    const result = await scrapeSections(term, emitter, 1);
    assert.ok(result);
    assert.equal(result.length, 1);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0].message, /section count mismatch/);
  });

  test("emitter events are fired correctly", async () => {
    const term = "202510";
    const section = makeBannerSection();
    mockAuthCookies(2);

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "1",
      })
      .reply(200, makeSectionResponse([section], 1, 0, 1));

    nock(BASE)
      .get(SEARCH_PATH)
      .query({
        txt_term: term,
        pageOffset: "0",
        pageMaxSize: "500",
      })
      .reply(200, makeSectionResponse([section], 1, 0, 500));

    const emitter = new ScraperEventEmitter();
    const events: string[] = [];

    emitter.on("scrape:sections:start", () => events.push("start"));
    emitter.on("scrape:sections:done", () => events.push("done"));
    emitter.on("debug", () => events.push("debug"));

    const result = await scrapeSections(term, emitter, 1);
    assert.ok(result);
    assert.ok(events.includes("start"));
    assert.ok(events.includes("done"));
    assert.ok(events.includes("debug"));
  });
});
