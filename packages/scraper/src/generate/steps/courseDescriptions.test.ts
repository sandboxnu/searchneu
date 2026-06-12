import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { FetchEngine } from "../fetch";
import { scrapeCourseDescriptions } from "./courseDescriptions";
import { ScraperEventEmitter } from "../../events";

const BASE_URL = "https://nubanner.neu.edu";
const TERM = "202510";
const POST_PATH =
  "/StudentRegistrationSsb/ssb/searchResults/getCourseDescription";

function makeFe() {
  return new FetchEngine({
    maxConcurrent: 1,
    throttleDelay: 0,
    initialRetryDelay: 10,
    maxRetries: 0,
  });
}

function makeItem(crn: string) {
  return { crn, description: "" };
}

describe("scrapeCourseDescriptions", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("successfully extracts description and updates item in place", async () => {
    const item = makeItem("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(200, "Introduction to algorithms and data structures.");

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(
      item.description,
      "Introduction to algorithms and data structures.",
    );
  });

  test("removes HTML tags from description", async () => {
    const item = makeItem("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(
        200,
        "<p>This course covers <b>advanced</b> topics in <em>CS</em>.</p>",
      );

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(
      item.description,
      "This course covers advanced topics in CS.",
    );
  });

  test("removes HTML comments from description", async () => {
    const item = makeItem("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(
        200,
        "Some text<!-- this is a comment --> and more text.",
      );

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(item.description, "Some text and more text.");
  });

  test("handles double HTML-encoded entities", async () => {
    const item = makeItem("12345");

    // &amp;amp; -> first decode -> &amp; -> second decode -> &
    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(200, "Algorithms &amp;amp; Data Structures");

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(item.description, "Algorithms & Data Structures");
  });

  test("trims whitespace from description", async () => {
    const item = makeItem("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(200, "   Some description with whitespace   ");

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(item.description, "Some description with whitespace");
  });

  test("returns failed CRNs on fetch failure", async () => {
    const item = makeItem("99999");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=99999`)
      .replyWithError("connection refused");

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, ["99999", "99999"]);
    assert.equal(item.description, "");
  });

  test("emits fetch:error event on failure", async () => {
    const item = makeItem("77777");
    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];

    emitter.on("fetch:error", (data) => {
      errors.push(data);
    });

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=77777`)
      .replyWithError("timeout");

    await scrapeCourseDescriptions(makeFe(), TERM, [item], emitter);

    assert.equal(errors.length, 2);
    assert.equal(errors[0].crn, "77777");
    assert.equal(errors[0].step, "description");
    assert.ok(errors[0].message.includes("timeout"));
  });

  test("processes multiple items", async () => {
    const item1 = makeItem("11111");
    const item2 = makeItem("22222");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=11111`)
      .reply(200, "First description.");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=22222`)
      .reply(200, "Second description.");

    const failed = await scrapeCourseDescriptions(
      makeFe(),
      TERM,
      [item1, item2],
    );

    assert.deepEqual(failed, []);
    assert.equal(item1.description, "First description.");
    assert.equal(item2.description, "Second description.");
  });

  test("handles combined HTML tags, comments, and entities", async () => {
    const item = makeItem("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(
        200,
        "<!-- comment --><p>Study of &amp;amp; in <b>depth</b>.</p><!-- end -->",
      );

    const failed = await scrapeCourseDescriptions(makeFe(), TERM, [item]);

    assert.deepEqual(failed, []);
    assert.equal(item.description, "Study of & in depth.");
  });
});
