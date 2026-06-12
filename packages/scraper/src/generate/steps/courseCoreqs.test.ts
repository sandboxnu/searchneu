import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { FetchEngine } from "../fetch";
import { scrapeCourseCoreqs } from "./courseCoreqs";
import { ScraperEventEmitter } from "../../events";

const fe = new FetchEngine({
  maxConcurrent: 1,
  throttleDelay: 0,
  initialRetryDelay: 10,
  maxRetries: 0,
});

const subjects = [
  { code: "CS", description: "Computer Science" },
  { code: "MATH", description: "Mathematics" },
];

const BANNER_BASE = "https://nubanner.neu.edu";
const COREQS_PATH =
  "/StudentRegistrationSsb/ssb/searchResults/getCorequisites";

afterEach(() => {
  nock.cleanAll();
});

describe("scrapeCourseCoreqs", () => {
  test("successfully fetches and parses coreqs, updates item in place", async () => {
    const html = `<table><tbody>
<tr><td>Computer Science</td><td>2501</td><td> </td></tr>
</tbody></table>`;

    nock(BANNER_BASE)
      .post(COREQS_PATH, `term=202410&courseReferenceNumber=12345`)
      .reply(200, html);

    const items = [{ crn: "12345", prereqs: {} as any }] as any[];
    const failed = await scrapeCourseCoreqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.deepEqual(items[0].coreqs, {
      subject: "CS",
      courseNumber: "2501",
    });
  });

  test("null/empty response leaves coreqs unchanged", async () => {
    nock(BANNER_BASE)
      .post(COREQS_PATH, `term=202410&courseReferenceNumber=12345`)
      .reply(200, "");

    const items = [{ crn: "12345", prereqs: {} as any }] as any[];
    const failed = await scrapeCourseCoreqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.equal(items[0].coreqs, undefined);
  });

  test("fetch failure adds CRN to failed list and emits fetch:error", async () => {
    nock(BANNER_BASE)
      .post(COREQS_PATH, `term=202410&courseReferenceNumber=99999`)
      .replyWithError("connection refused");

    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];
    emitter.on("fetch:error", (data) => errors.push(data));

    const items = [{ crn: "99999", prereqs: {} as any }] as any[];
    const failed = await scrapeCourseCoreqs(
      fe,
      "202410",
      items,
      subjects,
      emitter,
    );

    assert.ok(failed.includes("99999"));
    assert.ok(errors.length >= 1);
    assert.equal(errors[0].crn, "99999");
    assert.equal(errors[0].step, "coreqs");
  });

  test("multiple items are all processed", async () => {
    const html1 = `<table><tbody>
<tr><td>Computer Science</td><td>2501</td><td> </td></tr>
</tbody></table>`;

    const html2 = `<table><tbody>
<tr><td>Mathematics</td><td>2331</td><td> </td></tr>
</tbody></table>`;

    nock(BANNER_BASE)
      .post(COREQS_PATH, `term=202410&courseReferenceNumber=10001`)
      .reply(200, html1)
      .post(COREQS_PATH, `term=202410&courseReferenceNumber=10002`)
      .reply(200, html2);

    const items = [
      { crn: "10001", prereqs: {} as any },
      { crn: "10002", prereqs: {} as any },
    ] as any[];
    const failed = await scrapeCourseCoreqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.deepEqual(items[0].coreqs, {
      subject: "CS",
      courseNumber: "2501",
    });
    assert.deepEqual(items[1].coreqs, {
      subject: "MATH",
      courseNumber: "2331",
    });
  });
});
