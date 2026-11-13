import { afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";

import { BannerClient } from "./client";
import { sweep, SweepError } from "./sweep";
import { bannerSection, searchResponse, TEST_TERM } from "./testing";

const BASE = "https://nubanner.neu.edu";
const SEARCH = "/StudentRegistrationSsb/ssb/searchResults/searchResults";
const SESSION = "/StudentRegistrationSsb/ssb/term/search";
const SUBJECTS = "/StudentRegistrationSsb/ssb/classSearch/get_subject";
const CAMPUSES = "/StudentRegistrationSsb/ssb/classSearch/get_campus";
const TERMS = "/StudentRegistrationSsb/ssb/classSearch/getTerms";

function client() {
  return new BannerClient({
    initialRetryDelayMs: 1,
    maxRetryDelayMs: 2,
    maxRetries: 1,
  });
}

function mockReferenceData() {
  nock(BASE)
    .post(SESSION)
    .times(50)
    .reply(200, "", { "set-cookie": ["JSESSIONID=session; Path=/"] });
  nock(BASE)
    .get(TERMS)
    .query(true)
    .reply(200, [{ code: TEST_TERM, description: "Spring 2026" }]);
  nock(BASE)
    .get(SUBJECTS)
    .query(true)
    .reply(200, [{ code: "CS", description: "Computer Science" }]);
  nock(BASE)
    .get(CAMPUSES)
    .query(true)
    .reply(200, [{ code: "BOS", description: "Boston" }]);
}

function mockProbe(totalCount: number) {
  nock(BASE)
    .get(SEARCH)
    .query({ txt_term: TEST_TERM, pageOffset: 0, pageMaxSize: 1 })
    .reply(200, searchResponse([bannerSection()], totalCount));
}

function mockPage(
  offset: number,
  sections: ReturnType<typeof bannerSection>[],
  totalCount: number,
) {
  return nock(BASE)
    .get(SEARCH)
    .query({ txt_term: TEST_TERM, pageOffset: offset, pageMaxSize: 500 })
    .reply(200, searchResponse(sections, totalCount));
}

function page(count: number, startCrn: number) {
  return Array.from({ length: count }, (_, i) =>
    bannerSection({ courseReferenceNumber: String(startCrn + i) }),
  );
}

before(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});

describe("sweep", () => {
  test("walks every page Banner's total implies", async () => {
    mockReferenceData();
    mockProbe(1200);
    mockPage(0, page(500, 10000), 1200);
    mockPage(500, page(500, 20000), 1200);
    mockPage(1000, page(200, 30000), 1200);

    const result = await sweep(client(), TEST_TERM);

    assert.equal(result.sections.length, 1200);
    assert.equal(result.reportedTotal, 1200);
    assert.deepEqual(result.pages, [
      { offset: 0, received: 500 },
      { offset: 500, received: 500 },
      { offset: 1000, received: 200 },
    ]);
  });

  test("fails rather than returning a short term when a page dies", async () => {
    // downstream, a partial read is indistinguishable from mass deletion
    mockReferenceData();
    mockProbe(1000);
    mockPage(0, page(500, 10000), 1000);
    nock(BASE)
      .get(SEARCH)
      .query({ txt_term: TEST_TERM, pageOffset: 500, pageMaxSize: 500 })
      .times(2)
      .reply(500, "page exploded");

    const error = await sweep(client(), TEST_TERM)
      .then(() => null)
      .catch((e: unknown) => e);

    assert.ok(error instanceof SweepError);
    assert.equal(error.term, TEST_TERM);
    assert.equal(error.failures.length, 1);
    assert.match(error.message, /1 of 2 section pages failed/);
  });

  test("deduplicates CRNs that straddle a page boundary and counts them", async () => {
    // pagination is not a snapshot; a section added mid-sweep shifts rows
    mockReferenceData();
    mockProbe(1000);
    mockPage(0, page(500, 10000), 1000);
    mockPage(500, [...page(2, 10498), ...page(498, 20000)], 1000);

    const result = await sweep(client(), TEST_TERM);

    assert.equal(result.duplicates, 2);
    assert.equal(result.sections.length, 998);
    assert.equal(
      new Set(result.sections.map((s) => s.courseReferenceNumber)).size,
      998,
    );
  });

  test("records a short read instead of hiding it", async () => {
    // whether a shortfall is fatal is for the rails to decide, not sweep
    mockReferenceData();
    mockProbe(1000);
    mockPage(0, page(500, 10000), 1000);
    mockPage(500, page(400, 20000), 1000);

    const result = await sweep(client(), TEST_TERM);

    assert.equal(result.reportedTotal, 1000);
    assert.equal(result.sections.length, 900);
  });
});
