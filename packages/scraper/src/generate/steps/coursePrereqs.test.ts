import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { FetchEngine } from "../fetch";
import { scrapeCoursePrereqs } from "./coursePrereqs";
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
const PREREQS_PATH =
  "/StudentRegistrationSsb/ssb/searchResults/getSectionPrerequisites";

afterEach(() => {
  nock.cleanAll();
});

describe("scrapeCoursePrereqs", () => {
  test("successfully fetches and parses prereqs, updates item in place", async () => {
    const html = `<table><tbody>
<tr><td></td><td></td><td></td><td></td><td>Computer Science</td><td>2500</td><td></td><td></td><td></td></tr>
</tbody></table>`;

    nock(BANNER_BASE)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=12345`)
      .reply(200, html);

    const items = [{ crn: "12345", prereqs: {} as any }];
    const failed = await scrapeCoursePrereqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.deepEqual(items[0].prereqs, {
      subject: "CS",
      courseNumber: "2500",
    });
  });

  test("null/empty response leaves prereqs unchanged", async () => {
    nock(BANNER_BASE)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=12345`)
      .reply(200, "");

    const originalPrereqs = {};
    const items = [{ crn: "12345", prereqs: originalPrereqs as any }];
    const failed = await scrapeCoursePrereqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.equal(items[0].prereqs, originalPrereqs);
  });

  test("fetch failure adds CRN to failed list and emits fetch:error", async () => {
    nock(BANNER_BASE)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=99999`)
      .replyWithError("connection refused");

    const emitter = new ScraperEventEmitter();
    const errors: { crn?: string; step?: string; message: string }[] = [];
    emitter.on("fetch:error", (data) => errors.push(data));

    const items = [{ crn: "99999", prereqs: {} as any }];
    const failed = await scrapeCoursePrereqs(
      fe,
      "202410",
      items,
      subjects,
      emitter,
    );

    // CRN appears twice: once from fetch catch, once from zod parse of undefined
    assert.ok(failed.includes("99999"));
    assert.ok(errors.length >= 1);
    assert.equal(errors[0].crn, "99999");
    assert.equal(errors[0].step, "prereqs");
  });

  test("HTML entities are double-decoded before parsing", async () => {
    // Server returns double-encoded HTML: first decode yields &lt;/&gt; entities,
    // second decode yields actual angle brackets.
    const doubleEncoded = `&lt;table&gt;&lt;tbody&gt;
&lt;tr&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;Mathematics&lt;/td&gt;&lt;td&gt;1341&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;/tr&gt;
&lt;/tbody&gt;&lt;/table&gt;`;

    nock(BANNER_BASE)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=11111`)
      .reply(200, doubleEncoded);

    const items = [{ crn: "11111", prereqs: {} as any }];
    const failed = await scrapeCoursePrereqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.deepEqual(items[0].prereqs, {
      subject: "MATH",
      courseNumber: "1341",
    });
  });

  test("multiple items are all processed", async () => {
    const html1 = `<table><tbody>
<tr><td></td><td></td><td></td><td></td><td>Computer Science</td><td>2500</td><td></td><td></td><td></td></tr>
</tbody></table>`;

    const html2 = `<table><tbody>
<tr><td></td><td></td><td></td><td></td><td>Mathematics</td><td>2331</td><td></td><td></td><td></td></tr>
</tbody></table>`;

    nock(BANNER_BASE)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=10001`)
      .reply(200, html1)
      .post(PREREQS_PATH, `term=202410&courseReferenceNumber=10002`)
      .reply(200, html2);

    const items = [
      { crn: "10001", prereqs: {} as any },
      { crn: "10002", prereqs: {} as any },
    ];
    const failed = await scrapeCoursePrereqs(fe, "202410", items, subjects);

    assert.deepEqual(failed, []);
    assert.deepEqual(items[0].prereqs, {
      subject: "CS",
      courseNumber: "2500",
    });
    assert.deepEqual(items[1].prereqs, {
      subject: "MATH",
      courseNumber: "2331",
    });
  });
});
