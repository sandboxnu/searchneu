import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  baseUrl,
  sectionSearchEndpoint,
  sectionFacultyEndpoint,
  sectionCatalogDetailsEndpoint,
  courseDescriptionEndpoint,
  sectionPrereqsEndpoint,
  sectionCoreqsEndpoint,
  subjectsEndpoint,
} from "./endpoints.js";

describe("baseUrl", () => {
  test("is https://nubanner.neu.edu", () => {
    assert.equal(baseUrl, "https://nubanner.neu.edu");
  });
});

describe("sectionSearchEndpoint", () => {
  test("returns correct URL with query params", () => {
    const url = sectionSearchEndpoint("202510", 0, 25);
    assert.equal(
      url,
      "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_term=202510&pageOffset=0&pageMaxSize=25",
    );
  });
});

describe("sectionFacultyEndpoint", () => {
  test("returns correct URL", () => {
    const url = sectionFacultyEndpoint("202510", "12345");
    assert.equal(
      url,
      "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=202510&courseReferenceNumber=12345",
    );
  });
});

function assertPostEndpoint(
  fn: (term: string, crn: string) => readonly [string, { method: string; headers: Record<string, string>; body: string }],
  expectedPath: string,
) {
  const [url, init] = fn("202510", "12345");
  assert.equal(url, `${baseUrl}${expectedPath}`);
  assert.equal(init.method, "POST");
  assert.equal(init.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(init.body, "term=202510&courseReferenceNumber=12345");
}

describe("sectionCatalogDetailsEndpoint", () => {
  test("returns [url, requestInit] tuple with POST method and form body", () => {
    assertPostEndpoint(sectionCatalogDetailsEndpoint, "/StudentRegistrationSsb/ssb/searchResults/getSectionCatalogDetails");
  });
});

describe("courseDescriptionEndpoint", () => {
  test("returns [url, requestInit] tuple with POST method and form body", () => {
    assertPostEndpoint(courseDescriptionEndpoint, "/StudentRegistrationSsb/ssb/searchResults/getCourseDescription");
  });
});

describe("sectionPrereqsEndpoint", () => {
  test("returns [url, requestInit] tuple with POST method and form body", () => {
    assertPostEndpoint(sectionPrereqsEndpoint, "/StudentRegistrationSsb/ssb/searchResults/getSectionPrerequisites");
  });
});

describe("sectionCoreqsEndpoint", () => {
  test("returns [url, requestInit] tuple with POST method and form body", () => {
    assertPostEndpoint(sectionCoreqsEndpoint, "/StudentRegistrationSsb/ssb/searchResults/getCorequisites");
  });
});

describe("subjectsEndpoint", () => {
  test("returns correct URL", () => {
    const url = subjectsEndpoint("202510");
    assert.equal(
      url,
      "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject?term=202510&offset=1&max=900",
    );
  });
});
