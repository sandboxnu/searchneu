import { afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";

import { BannerClient } from "./client";
import { buildSnapshot } from "./pipeline";
import { bannerSection, searchResponse, TEST_TERM } from "./testing";
import {
  parseSnapshot,
  TermSnapshot,
  toBannerCache,
} from "../schemas/scraper/snapshot";
import { ScraperBannerCache } from "../schemas/scraper/banner-cache";

const BASE = "https://nubanner.neu.edu";
const SSB = "/StudentRegistrationSsb/ssb";
const RESULTS = `${SSB}/searchResults`;

function client() {
  return new BannerClient({
    initialRetryDelayMs: 1,
    maxRetryDelayMs: 2,
    maxRetries: 1,
  });
}

function mockTerm({
  subjects = [{ code: "CS", description: "Computer Science" }],
  prereqs = "<p>none</p>",
} = {}) {
  const sections = [
    bannerSection({ courseReferenceNumber: "70001" }),
    bannerSection({ courseReferenceNumber: "70002", courseNumber: "3000" }),
  ];

  nock(BASE)
    .post(`${SSB}/term/search`)
    .times(50)
    .reply(200, "", { "set-cookie": ["JSESSIONID=session; Path=/"] });
  nock(BASE)
    .get(`${SSB}/classSearch/getTerms`)
    .query(true)
    .reply(200, [{ code: TEST_TERM, description: "Spring 2026" }]);
  nock(BASE)
    .get(`${SSB}/classSearch/get_subject`)
    .query(true)
    .reply(200, subjects);
  nock(BASE)
    .get(`${SSB}/classSearch/get_campus`)
    .query(true)
    .reply(200, [{ code: "BOS", description: "Boston" }]);
  nock(BASE)
    .get(`${RESULTS}/searchResults`)
    .query(true)
    .times(2)
    .reply(200, searchResponse(sections, 2));

  nock(BASE)
    .post(`${RESULTS}/getSectionCatalogDetails`)
    .times(2)
    .reply(200, "Catalog\nTitle: Fundamentals of Computer Science 1");
  nock(BASE)
    .post(`${RESULTS}/getCourseDescription`)
    .times(2)
    .reply(200, "<p>A course.</p>");
  nock(BASE)
    .post(`${RESULTS}/getSectionPrerequisites`)
    .times(2)
    .reply(200, prereqs);
  nock(BASE)
    .post(`${RESULTS}/getCorequisites`)
    .times(2)
    .reply(200, "<p>none</p>");
  nock(BASE)
    .get(`${RESULTS}/getFacultyMeetingTimes`)
    .query(true)
    .times(2)
    .reply(200, { fmt: [] });
}

before(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});

describe("buildSnapshot", () => {
  test("scrapes every course into a snapshot its own schema accepts", async () => {
    mockTerm();

    const { snapshot, details } = await buildSnapshot(client(), TEST_TERM);

    assert.deepEqual(details.failures, []);
    assert.equal(details.courses.length, 2);

    TermSnapshot.parse(snapshot);
    assert.equal(snapshot.courses.length, 2);
    assert.equal(snapshot.courses[0].description, "A course.");
    assert.equal(
      snapshot.courses[0].name,
      "Fundamentals of Computer Science 1",
    );
  });

  test("matches requisites against decoded subject names", async () => {
    // Banner sends subject names HTML-encoded, but requisites are decoded
    mockTerm({
      subjects: [
        { code: "CS", description: "Computer Science" },
        { code: "CHEM", description: "Chemistry &amp; Chemical Biology" },
      ],
      prereqs: `<table><tbody>
        <tr><td></td><td></td><td></td><td></td><td>Chemistry &amp; Chemical Biology</td><td>1151</td><td>D-</td><td></td><td></td></tr>
      </tbody></table>`,
    });

    const { snapshot } = await buildSnapshot(client(), TEST_TERM);

    assert.deepEqual(snapshot.courses[0].prereqs, {
      subject: "CHEM",
      courseNumber: "1151",
    });
  });
});

describe("cache compatibility", () => {
  test("downgrades to the shape the uploader reads", async () => {
    mockTerm();
    const { snapshot } = await buildSnapshot(client(), TEST_TERM);

    const cache = toBannerCache(snapshot);

    ScraperBannerCache.parse(cache);
    assert.equal(cache.version, 5);
  });

  test("reads a v5 cache back as a snapshot", async () => {
    mockTerm();
    const { snapshot } = await buildSnapshot(client(), TEST_TERM);

    const restored = parseSnapshot({
      ...toBannerCache(snapshot),
      // a v5 file may name a course's representative section
      courses: snapshot.courses.map((c) => ({ ...c, crn: "70001" })),
    });

    assert.deepEqual(restored, snapshot);
  });

  test("round-trips a v6 cache unchanged", async () => {
    mockTerm();
    const { snapshot } = await buildSnapshot(client(), TEST_TERM);

    assert.deepEqual(
      parseSnapshot(JSON.parse(JSON.stringify(snapshot))),
      snapshot,
    );
  });

  test("rejects a file that is neither", () => {
    assert.throws(() => parseSnapshot({ version: 99 }), /unrecognised cache/);
  });
});
