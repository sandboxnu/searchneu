import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { FetchEngine } from "../fetch";
import { scrapeMeetingsFaculty } from "./meetingsFaculty";
import { ScraperEventEmitter } from "../../events";
import type { Section } from "../../types";

const BASE_URL = "https://nubanner.neu.edu";
const TERM = "202510";

function makeFe() {
  return new FetchEngine({
    maxConcurrent: 1,
    throttleDelay: 0,
    initialRetryDelay: 10,
    maxRetries: 0,
  });
}

function makeSection(crn: string): Section {
  return {
    crn,
    name: "",
    description: "",
    sectionNumber: "01",
    partOfTerm: "1",
    seatCapacity: 30,
    seatRemaining: 10,
    waitlistCapacity: 0,
    waitlistRemaining: 0,
    classType: "Lecture",
    honors: false,
    campus: "BOS",
    meetingTimes: [],
    faculty: [],
    xlist: [],
    coreqs: {},
    prereqs: {},
  };
}

function makeFacultyResponse(
  crn: string,
  term: string,
  faculty: {
    displayName: string;
    emailAddress: string | null;
    primaryIndicator: boolean;
    bannerId?: string;
  }[],
) {
  return {
    fmt: [
      {
        category: "01",
        class: "net.hedtech.banner.general.overall.SectionMeetingTimeView",
        courseReferenceNumber: crn,
        faculty: faculty.map((f) => ({
          bannerId: f.bannerId ?? "12345",
          category: "01",
          class:
            "net.hedtech.banner.general.overall.SectionMeetingTimeFacultyView",
          courseReferenceNumber: crn,
          displayName: f.displayName,
          emailAddress: f.emailAddress,
          primaryIndicator: f.primaryIndicator,
          term,
        })),
        meetingTime: {
          beginTime: "0800",
          building: "SN",
          buildingDescription: "Snell Library",
          campus: "BOS",
          campusDescription: "Boston",
          category: "01",
          class:
            "net.hedtech.banner.general.overall.SectionMeetingTimeView",
          courseReferenceNumber: crn,
          creditHourSession: 4,
          endDate: "12/10/2025",
          endTime: "0940",
          friday: false,
          hoursWeek: 2.66,
          meetingScheduleType: "LEC",
          meetingType: "CLAS",
          meetingTypeDescription: "Class",
          monday: true,
          room: "108",
          saturday: false,
          startDate: "09/01/2025",
          sunday: false,
          term,
          thursday: false,
          tuesday: false,
          wednesday: true,
        },
        term,
      },
    ],
  };
}

describe("scrapeMeetingsFaculty", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("successfully extracts faculty and updates section in place", async () => {
    const section = makeSection("12345");
    const responseBody = makeFacultyResponse("12345", TERM, [
      {
        displayName: "John Smith",
        emailAddress: "j.smith@northeastern.edu",
        primaryIndicator: true,
      },
    ]);

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=12345`,
      )
      .reply(200, responseBody);

    const failed = await scrapeMeetingsFaculty(
      makeFe(),
      TERM,
      [section],
    );

    assert.deepEqual(failed, []);
    assert.equal(section.faculty.length, 1);
    assert.equal(section.faculty[0].displayName, "John Smith");
    assert.equal(section.faculty[0].email, "j.smith@northeastern.edu");
    assert.equal(section.faculty[0].primary, true);
  });

  test("handles HTML entities in faculty names (double decode)", async () => {
    const section = makeSection("12345");
    // Double-encoded ampersand: &amp;amp; -> first decode -> &amp; -> second decode -> &
    const responseBody = makeFacultyResponse("12345", TERM, [
      {
        displayName: "O&amp;amp;Brien",
        emailAddress: null,
        primaryIndicator: false,
      },
    ]);

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=12345`,
      )
      .reply(200, responseBody);

    const failed = await scrapeMeetingsFaculty(
      makeFe(),
      TERM,
      [section],
    );

    assert.deepEqual(failed, []);
    assert.equal(section.faculty[0].displayName, "O&Brien");
    assert.equal(section.faculty[0].email, null);
    assert.equal(section.faculty[0].primary, false);
  });

  test("returns failed CRNs array on fetch failure", async () => {
    const section = makeSection("99999");

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=99999`,
      )
      .replyWithError("connection refused");

    const failed = await scrapeMeetingsFaculty(
      makeFe(),
      TERM,
      [section],
    );

    assert.deepEqual(failed, ["99999", "99999"]);
    assert.deepEqual(section.faculty, []);
  });

  test("returns failed CRNs on parse failure", async () => {
    const section = makeSection("88888");

    // Return an object that does not match the expected schema (missing "fmt" key)
    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=88888`,
      )
      .reply(200, { invalid: "data" });

    const failed = await scrapeMeetingsFaculty(
      makeFe(),
      TERM,
      [section],
    );

    assert.deepEqual(failed, ["88888"]);
    assert.deepEqual(section.faculty, []);
  });

  test("emits fetch:error event on fetch failure", async () => {
    const section = makeSection("77777");
    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];

    emitter.on("fetch:error", (data) => {
      errors.push(data);
    });

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=77777`,
      )
      .replyWithError("timeout");

    await scrapeMeetingsFaculty(makeFe(), TERM, [section], emitter);

    assert.equal(errors.length, 2);
    assert.equal(errors[0].crn, "77777");
    assert.equal(errors[0].step, "faculty");
    assert.ok(errors[0].message.includes("timeout"));
  });

  test("emits fetch:error event on parse failure", async () => {
    const section = makeSection("66666");
    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];

    emitter.on("fetch:error", (data) => {
      errors.push(data);
    });

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=66666`,
      )
      .reply(200, { notFmt: [] });

    await scrapeMeetingsFaculty(makeFe(), TERM, [section], emitter);

    assert.equal(errors.length, 1);
    assert.equal(errors[0].crn, "66666");
    assert.equal(errors[0].step, "faculty");
  });

  test("processes multiple sections", async () => {
    const section1 = makeSection("11111");
    const section2 = makeSection("22222");

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=11111`,
      )
      .reply(
        200,
        makeFacultyResponse("11111", TERM, [
          {
            displayName: "Alice",
            emailAddress: "alice@neu.edu",
            primaryIndicator: true,
          },
        ]),
      );

    nock(BASE_URL)
      .get(
        `/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${TERM}&courseReferenceNumber=22222`,
      )
      .reply(
        200,
        makeFacultyResponse("22222", TERM, [
          {
            displayName: "Bob",
            emailAddress: "bob@neu.edu",
            primaryIndicator: false,
          },
        ]),
      );

    const failed = await scrapeMeetingsFaculty(
      makeFe(),
      TERM,
      [section1, section2],
    );

    assert.deepEqual(failed, []);
    assert.equal(section1.faculty[0].displayName, "Alice");
    assert.equal(section2.faculty[0].displayName, "Bob");
  });
});
