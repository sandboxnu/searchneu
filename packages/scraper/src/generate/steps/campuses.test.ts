import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { scrapeCampuses } from "./campuses";
import { ScraperEventEmitter } from "../../events";

const BASE = "https://nubanner.neu.edu";
const CAMPUSES_PATH =
  "/StudentRegistrationSsb/ssb/classSearch/get_campus";

afterEach(() => {
  nock.cleanAll();
});

describe("scrapeCampuses", () => {
  test("returns array of campus objects on success", async () => {
    nock(BASE)
      .get(CAMPUSES_PATH)
      .query({ searchTerm: "", term: "202510", offset: "1", max: "100" })
      .reply(200, [
        { code: "BOS", description: "Boston" },
        { code: "OAK", description: "Oakland" },
      ]);

    const result = await scrapeCampuses("202510");
    assert.deepStrictEqual(result, [
      { code: "BOS", description: "Boston" },
      { code: "OAK", description: "Oakland" },
    ]);
  });

  test("returns undefined and emits error on parse failure", async () => {
    nock(BASE)
      .get(CAMPUSES_PATH)
      .query({ searchTerm: "", term: "202510", offset: "1", max: "100" })
      .reply(200, { unexpected: "format" });

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeCampuses("202510", emitter);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "error parsing banner campus info");
  });
});
