import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { FetchEngine } from "../fetch";
import { scrapeCatalogDetails } from "./courseNames";
import { ScraperEventEmitter } from "../../events";
import type { Course } from "../../types";

const BASE_URL = "https://nubanner.neu.edu";
const TERM = "202510";
const POST_PATH =
  "/StudentRegistrationSsb/ssb/searchResults/getSectionCatalogDetails";

function makeFe() {
  return new FetchEngine({
    maxConcurrent: 1,
    throttleDelay: 0,
    initialRetryDelay: 10,
    maxRetries: 0,
  });
}

function makeCourse(crn: string): Course & { crn: string } {
  return {
    subject: "CS",
    courseNumber: "2500",
    specialTopics: false,
    name: "",
    description: "",
    maxCredits: 4,
    minCredits: 4,
    attributes: [],
    coreqs: {},
    prereqs: {},
    postreqs: {},
    crn,
  };
}

describe("scrapeCatalogDetails", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("successfully extracts title from HTML response", async () => {
    const course = makeCourse("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(
        200,
        "<br/>\nTitle:Fundamentals of Computer Science\n<br/>Some other info",
      );

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, []);
    assert.equal(course.name, "Fundamentals of Computer Science");
  });

  test("strips HTML tags from response before extracting title", async () => {
    const course = makeCourse("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(
        200,
        "<p><b>Title:</b><em>Algorithms &amp;amp; Data</em></p>",
      );

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, []);
    assert.equal(course.name, "Algorithms & Data");
  });

  test("falls back to 'Unknown' when no Title: line is present", async () => {
    const course = makeCourse("12345");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(200, "Some random catalog text with no title line");

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, []);
    assert.equal(course.name, "Unknown");
  });

  test("returns failed CRNs on fetch failure", async () => {
    const course = makeCourse("99999");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=99999`)
      .replyWithError("connection refused");

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, ["99999", "99999"]);
    assert.equal(course.name, "");
  });

  test("returns failed CRNs when fetch error causes undefined response", async () => {
    const course = makeCourse("88888");

    // A fetch error returns undefined, which fails z.string() parse
    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=88888`)
      .replyWithError("server error");

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, ["88888", "88888"]);
  });

  test("emits fetch:error on failure", async () => {
    const course = makeCourse("77777");
    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];

    emitter.on("fetch:error", (data) => {
      errors.push(data);
    });

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=77777`)
      .replyWithError("timeout");

    await scrapeCatalogDetails(makeFe(), TERM, [course], emitter);

    assert.equal(errors.length, 2);
    assert.equal(errors[0].crn, "77777");
    assert.equal(errors[0].step, "catalog-details");
    assert.ok(errors[0].message.includes("timeout"));
  });

  test("handles double HTML-encoded entities", async () => {
    const course = makeCourse("12345");

    // &amp;amp; -> first decode -> &amp; -> second decode -> &
    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=12345`)
      .reply(200, "Title:Algorithms &amp;amp; Data Structures");

    const failed = await scrapeCatalogDetails(makeFe(), TERM, [course]);

    assert.deepEqual(failed, []);
    assert.equal(course.name, "Algorithms & Data Structures");
  });

  test("processes multiple courses", async () => {
    const course1 = makeCourse("11111");
    const course2 = makeCourse("22222");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=11111`)
      .reply(200, "Title:Algorithms");

    nock(BASE_URL)
      .post(POST_PATH, `term=${TERM}&courseReferenceNumber=22222`)
      .reply(200, "Title:Networks");

    const failed = await scrapeCatalogDetails(
      makeFe(),
      TERM,
      [course1, course2],
    );

    assert.deepEqual(failed, []);
    assert.equal(course1.name, "Algorithms");
    assert.equal(course2.name, "Networks");
  });
});
