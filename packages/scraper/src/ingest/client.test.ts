import { afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";

import { BannerClient, BannerError } from "./client";
import { bannerSection, searchResponse, TEST_TERM } from "./testing";

const BASE = "https://nubanner.neu.edu";
const SEARCH = "/StudentRegistrationSsb/ssb/searchResults/searchResults";
const SESSION = "/StudentRegistrationSsb/ssb/term/search";
const TERMS = "/StudentRegistrationSsb/ssb/classSearch/getTerms";

/** Fast retries; the backoff itself is not under test. */
function client(options = {}) {
  return new BannerClient({
    initialRetryDelayMs: 1,
    maxRetryDelayMs: 2,
    maxRetries: 2,
    ...options,
  });
}

function mockSession(times = 1) {
  return nock(BASE)
    .post(SESSION)
    .times(times)
    .reply(200, "", { "set-cookie": ["JSESSIONID=session; Path=/"] });
}

before(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});

describe("BannerClient", () => {
  test("sends the session cookie Banner handed it", async () => {
    mockSession();
    const scope = nock(BASE, { reqheaders: { cookie: "JSESSIONID=session" } })
      .get(SEARCH)
      .query(true)
      .reply(200, searchResponse([bannerSection()], 1));

    const result = await client().searchSections(TEST_TERM, 0, 500);

    assert.equal(result.totalCount, 1);
    assert.equal(result.sections.length, 1);
    scope.done();
  });

  test("retries a 500 and keeps the answer from the retry", async () => {
    mockSession();
    nock(BASE).get(SEARCH).query(true).reply(500, "upstream exploded");
    nock(BASE)
      .get(SEARCH)
      .query(true)
      .reply(200, searchResponse([bannerSection()], 1));

    const api = client();
    const result = await api.searchSections(TEST_TERM, 0, 500);

    assert.equal(result.sections.length, 1);
    assert.equal(api.stats().retries, 1);
  });

  test("gives up after the retry budget and reports the attempts", async () => {
    mockSession();
    nock(BASE).get(SEARCH).query(true).times(3).reply(503, "nope");

    const api = client();
    const error = await api
      .searchSections(TEST_TERM, 0, 500)
      .then(() => null)
      .catch((e: unknown) => e);

    assert.ok(error instanceof BannerError);
    assert.equal(error.attempts, 3);
    assert.equal(error.status, 503);
    assert.equal(api.stats().failures, 1);
  });

  test("does not retry a status Banner will not recover from", async () => {
    mockSession();
    const scope = nock(BASE).get(SEARCH).query(true).reply(404, "gone");

    const api = client();
    await assert.rejects(
      () => api.searchSections(TEST_TERM, 0, 500),
      (error: unknown) => error instanceof BannerError && error.status === 404,
    );

    assert.equal(api.stats().retries, 0);
    scope.done();
  });

  test("treats an HTML body as an expired session and retries", async () => {
    // Banner answers a lapsed session with a 200 and a login page
    mockSession(2);
    nock(BASE)
      .get(SEARCH)
      .query(true)
      .reply(200, "<html><body>Please log in</body></html>");
    nock(BASE)
      .get(SEARCH)
      .query(true)
      .reply(200, searchResponse([bannerSection()], 1));

    const api = client();
    const result = await api.searchSections(TEST_TERM, 0, 500);

    assert.equal(result.sections.length, 1);
    assert.equal(api.stats().retries, 1);
  });

  test("rejects a response that does not match the schema", async () => {
    mockSession();
    nock(BASE)
      .get(SEARCH)
      .query(true)
      .reply(200, { success: true, data: "not an array" });

    await assert.rejects(
      () => client().searchSections(TEST_TERM, 0, 500),
      (error: unknown) =>
        error instanceof BannerError &&
        error.message.includes("unexpected section search response"),
    );
  });

  test("accepts a page without result configs", async () => {
    mockSession();
    nock(BASE)
      .get(SEARCH)
      .query(true)
      .reply(200, {
        ...searchResponse([bannerSection()], 1),
        searchResultsConfigs: null,
      });

    const result = await client().searchSections(TEST_TERM, 0, 500);

    assert.equal(result.sections.length, 1);
  });

  test("stops once its signal is aborted", async () => {
    mockSession();
    nock(BASE).get(SEARCH).query(true).times(3).reply(500, "slow failure");

    const controller = new AbortController();
    const api = client({ signal: controller.signal, initialRetryDelayMs: 50 });
    const pending = api.searchSections(TEST_TERM, 0, 500);
    controller.abort();

    await assert.rejects(
      () => pending,
      (error: unknown) =>
        error instanceof BannerError && error.message.includes("aborted"),
    );
  });

  describe("termDefinition", () => {
    test("returns the one term that matches", async () => {
      nock(BASE)
        .get(TERMS)
        .query(true)
        .reply(200, [
          { code: TEST_TERM, description: "Spring 2026" },
          { code: "202550", description: "Fall 2025" },
        ]);

      const term = await client().termDefinition(TEST_TERM);

      assert.deepEqual(term, { code: TEST_TERM, description: "Spring 2026" });
    });

    test("fails when Banner does not know the term", async () => {
      nock(BASE).get(TERMS).query(true).reply(200, []);

      await assert.rejects(
        () => client().termDefinition(TEST_TERM),
        (error: unknown) =>
          error instanceof BannerError &&
          error.message.includes("does not know term"),
      );
    });
  });

  test("never exceeds its concurrency limit", async () => {
    nock(BASE)
      .get(TERMS)
      .query(true)
      .times(6)
      .delay(5)
      .reply(200, [{ code: TEST_TERM, description: "Spring 2026" }]);

    const api = client({ maxConcurrent: 2 });
    let peak = 0;

    await Promise.all(
      Array.from({ length: 6 }, async () => {
        const pending = api.termDefinition(TEST_TERM);
        peak = Math.max(peak, api.stats().inFlight);
        await pending;
      }),
    );

    assert.ok(peak <= 2, `peak concurrency was ${peak}`);
  });
});
