import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { courseReferenceKey, extractCourseReferences } from "./coreqs";

describe("extractCourseReferences", () => {
  test("treats an absent requisite as no corequisites", () => {
    // Banner stores "no requirement" as an empty object, not null.
    assert.deepEqual(extractCourseReferences({}), []);
    assert.deepEqual(extractCourseReferences(null), []);
    assert.deepEqual(extractCourseReferences(undefined), []);
  });

  test("reads a requisite that is a single course", () => {
    assert.deepEqual(
      extractCourseReferences({ subject: "CHEM", courseNumber: "1212" }),
      [{ subject: "CHEM", courseNumber: "1212" }],
    );
  });

  test("flattens nested and/or conditions", () => {
    const coreqs = {
      type: "and",
      items: [
        { subject: "CHEM", courseNumber: "1213" },
        {
          type: "or",
          items: [
            { subject: "CHEM", courseNumber: "1214" },
            { subject: "CHEM", courseNumber: "1215" },
          ],
        },
      ],
    };

    assert.deepEqual(extractCourseReferences(coreqs).map(courseReferenceKey), [
      "CHEM:1213",
      "CHEM:1214",
      "CHEM:1215",
    ]);
  });

  test("skips test requisites, which are not courses", () => {
    const coreqs = {
      type: "and",
      items: [
        { name: "Math Placement", score: 70 },
        { subject: "MATH", courseNumber: "1341" },
      ],
    };

    assert.deepEqual(extractCourseReferences(coreqs), [
      { subject: "MATH", courseNumber: "1341" },
    ]);
  });

  test("keys distinguish courses that share a number", () => {
    assert.notEqual(
      courseReferenceKey({ subject: "CHEM", courseNumber: "1211" }),
      courseReferenceKey({ subject: "BIOL", courseNumber: "1211" }),
    );
  });
});
