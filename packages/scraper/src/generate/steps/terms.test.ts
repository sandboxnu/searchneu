import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { scrapeTermDefinition } from "./terms";
import { ScraperEventEmitter } from "../../events";

const BASE = "https://nubanner.neu.edu";
const TERMS_PATH =
  "/StudentRegistrationSsb/ssb/classSearch/getTerms";

afterEach(() => {
  nock.cleanAll();
});

describe("scrapeTermDefinition", () => {
  test("returns matching term object on success", async () => {
    nock(BASE)
      .get(TERMS_PATH)
      .query({ offset: "1", max: "10", searchTerm: "202510" })
      .reply(200, [
        { code: "202510", description: "Spring 2025" },
        { code: "202530", description: "Summer 2025" },
      ]);

    const result = await scrapeTermDefinition("202510");
    assert.deepStrictEqual(result, {
      code: "202510",
      description: "Spring 2025",
    });
  });

  test("returns undefined and emits error when no matching term found", async () => {
    nock(BASE)
      .get(TERMS_PATH)
      .query({ offset: "1", max: "10", searchTerm: "202510" })
      .reply(200, [{ code: "202530", description: "Summer 2025" }]);

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeTermDefinition("202510", emitter);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "cannot find term in Banner");
  });

  test("returns undefined and emits error when multiple matching terms found", async () => {
    nock(BASE)
      .get(TERMS_PATH)
      .query({ offset: "1", max: "10", searchTerm: "202510" })
      .reply(200, [
        { code: "202510", description: "Spring 2025" },
        { code: "202510", description: "Spring 2025 (View Only)" },
      ]);

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeTermDefinition("202510", emitter);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "multiple matching terms found");
  });

  test("returns undefined and emits error on parse failure", async () => {
    nock(BASE)
      .get(TERMS_PATH)
      .query({ offset: "1", max: "10", searchTerm: "202510" })
      .reply(200, { unexpected: "format" });

    const emitter = new ScraperEventEmitter();
    const errors: { message: string }[] = [];
    emitter.on("error", (data) => errors.push(data));

    const result = await scrapeTermDefinition("202510", emitter);
    assert.equal(result, undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "error parsing banner term info");
  });
});
