import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parsePrereqs, parseCoreqs, populatePostReqs } from "./reqs";
import type { Course, Condition, ReqsCourse, Test } from "../../types";

const subjects = [
  { code: "CS", description: "Computer Science" },
  { code: "MATH", description: "Mathematics" },
  { code: "PHYS", description: "Physics" },
  { code: "ENGW", description: "English Writing" },
];

/**
 * Build a prereq-style HTML table. Each row has 9 columns:
 *   [0] And/Or, [1] open paren, [2] test name, [3] test score,
 *   [4] subject name, [5] course number, [6] unused, [7] unused, [8] close paren
 */
function prereqRow(
  andOr: string,
  open: string,
  testName: string,
  testScore: string,
  subjectName: string,
  courseNumber: string,
  close: string,
): string {
  return `<tr><td>${andOr}</td><td>${open}</td><td>${testName}</td><td>${testScore}</td><td>${subjectName}</td><td>${courseNumber}</td><td> </td><td> </td><td>${close}</td></tr>`;
}

function wrapTable(rows: string): string {
  return `<table><tbody>${rows}</tbody></table>`;
}

// Helper: build a coreq row with 3 columns (no condition prefix)
function coreq3ColRow(subjectName: string, courseNumber: string): string {
  return `<tr><td>${subjectName}</td><td>${courseNumber}</td><td> </td></tr>`;
}

// Helper: build a coreq row with 4 columns (with condition prefix)
function coreq4ColRow(
  condition: string,
  subjectName: string,
  courseNumber: string,
): string {
  return `<tr><td>${condition}</td><td>${subjectName}</td><td>${courseNumber}</td><td> </td></tr>`;
}

/** Create a minimal Course object for testing populatePostReqs. */
function makeCourse(
  subject: string,
  courseNumber: string,
  prereqs: Course["prereqs"],
): Course {
  return {
    subject,
    courseNumber,
    specialTopics: false,
    name: `${subject} ${courseNumber}`,
    description: "",
    maxCredits: 4,
    minCredits: 4,
    attributes: [],
    coreqs: {},
    prereqs,
    postreqs: {},
  };
}

// ---------- parsePrereqs ----------

describe("parsePrereqs", () => {
  test("returns empty object when HTML has no tbody", () => {
    const result = parsePrereqs("<table></table>", subjects);
    assert.deepEqual(result, {});
  });

  test("returns empty object for empty string", () => {
    const result = parsePrereqs("", subjects);
    assert.deepEqual(result, {});
  });

  test("extracts single course prerequisite", () => {
    const html = wrapTable(
      prereqRow(" ", " ", " ", " ", "Computer Science", "2500", " "),
    );
    const result = parsePrereqs(html, subjects);
    assert.deepEqual(result, { subject: "CS", courseNumber: "2500" });
  });

  test("extracts AND conditions between courses", () => {
    const rows =
      prereqRow(" ", " ", " ", " ", "Computer Science", "2500", " ") +
      prereqRow("And", " ", " ", " ", "Mathematics", "1341", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "and");
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "2500",
    });
    assert.deepEqual(result.items[1], {
      subject: "MATH",
      courseNumber: "1341",
    });
  });

  test("extracts OR conditions between courses", () => {
    const rows =
      prereqRow(" ", " ", " ", " ", "Computer Science", "2500", " ") +
      prereqRow("Or", " ", " ", " ", "Computer Science", "2510", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "or");
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "2500",
    });
    assert.deepEqual(result.items[1], {
      subject: "CS",
      courseNumber: "2510",
    });
  });

  test("handles nested conditions with parentheses (stack-based parsing)", () => {
    // (CS 2500 OR CS 2510) AND MATH 1341
    const rows =
      prereqRow(" ", "(", " ", " ", "Computer Science", "2500", " ") +
      prereqRow("Or", " ", " ", " ", "Computer Science", "2510", ")") +
      prereqRow("And", " ", " ", " ", "Mathematics", "1341", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "and");
    assert.equal(result.items.length, 2);

    const nested = result.items[0] as Condition;
    assert.equal(nested.type, "or");
    assert.equal(nested.items.length, 2);
    assert.deepEqual(nested.items[0], {
      subject: "CS",
      courseNumber: "2500",
    });
    assert.deepEqual(nested.items[1], {
      subject: "CS",
      courseNumber: "2510",
    });
    assert.deepEqual(result.items[1], {
      subject: "MATH",
      courseNumber: "1341",
    });
  });

  test("extracts test score prerequisites", () => {
    const html = wrapTable(
      prereqRow(" ", " ", "SAT Mathematics", "600", " ", " ", " "),
    );
    const result = parsePrereqs(html, subjects) as Test;
    assert.equal(result.name, "SAT Mathematics");
    assert.equal(result.score, 600);
  });

  test("handles mixed courses and tests in conditions", () => {
    const rows =
      prereqRow(" ", " ", " ", " ", "Computer Science", "1800", " ") +
      prereqRow("Or", " ", "AP Computer Science", "4", " ", " ", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "or");
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "1800",
    });
    assert.deepEqual(result.items[1], {
      name: "AP Computer Science",
      score: 4,
    });
  });

  test("returns '??' for unknown subject name", () => {
    const html = wrapTable(
      prereqRow(" ", " ", " ", " ", "Underwater Basket Weaving", "1000", " "),
    );
    const result = parsePrereqs(html, subjects) as ReqsCourse;
    assert.equal(result.subject, "??");
    assert.equal(result.courseNumber, "1000");
  });

  test("condition merging: same-type nested conditions get flattened", () => {
    // (CS 2500 OR CS 2510) OR CS 3500
    // The inner OR should be merged into the outer OR
    const rows =
      prereqRow(" ", "(", " ", " ", "Computer Science", "2500", " ") +
      prereqRow("Or", " ", " ", " ", "Computer Science", "2510", ")") +
      prereqRow("Or", " ", " ", " ", "Computer Science", "3500", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "or");
    // After merging, all 3 courses should be in a single OR
    assert.equal(result.items.length, 3);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "3500",
    });
    assert.deepEqual(result.items[1], {
      subject: "CS",
      courseNumber: "2500",
    });
    assert.deepEqual(result.items[2], {
      subject: "CS",
      courseNumber: "2510",
    });
  });

  test("does not merge different-type nested conditions", () => {
    // (CS 2500 AND CS 2510) OR MATH 1341
    const rows =
      prereqRow(" ", "(", " ", " ", "Computer Science", "2500", " ") +
      prereqRow("And", " ", " ", " ", "Computer Science", "2510", ")") +
      prereqRow("Or", " ", " ", " ", "Mathematics", "1341", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects) as Condition;
    assert.equal(result.type, "or");
    assert.equal(result.items.length, 2);

    const nested = result.items[0] as Condition;
    assert.equal(nested.type, "and");
    assert.equal(nested.items.length, 2);
    assert.deepEqual(result.items[1], {
      subject: "MATH",
      courseNumber: "1341",
    });
  });

  test("handles tbody with rows but no course or test data", () => {
    const rows = prereqRow(" ", " ", " ", " ", " ", " ", " ");
    const html = wrapTable(rows);
    const result = parsePrereqs(html, subjects);
    assert.deepEqual(result, {});
  });
});

// ---------- parseCoreqs ----------

describe("parseCoreqs", () => {
  test("returns empty object when HTML has no tbody", () => {
    const result = parseCoreqs("<table></table>", subjects);
    assert.deepEqual(result, {});
  });

  test("returns empty object for empty string", () => {
    const result = parseCoreqs("", subjects);
    assert.deepEqual(result, {});
  });

  test("extracts single corequisite course (3-column row)", () => {
    const html = wrapTable(coreq3ColRow("Computer Science", "2510"));
    const result = parseCoreqs(html, subjects);
    assert.deepEqual(result, { subject: "CS", courseNumber: "2510" });
  });

  test("wraps multiple corequisites in AND condition (3-column rows)", () => {
    const rows =
      coreq3ColRow("Computer Science", "2510") +
      coreq3ColRow("Mathematics", "1341");
    const html = wrapTable(rows);
    const result = parseCoreqs(html, subjects) as Condition;
    assert.equal(result.type, "and");
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "2510",
    });
    assert.deepEqual(result.items[1], {
      subject: "MATH",
      courseNumber: "1341",
    });
  });

  test("handles 4-column rows with condition prefix", () => {
    const rows =
      coreq4ColRow(" ", "Computer Science", "2510") +
      coreq4ColRow("And", "Physics", "1151");
    const html = wrapTable(rows);
    const result = parseCoreqs(html, subjects) as Condition;
    assert.equal(result.type, "and");
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items[0], {
      subject: "CS",
      courseNumber: "2510",
    });
    assert.deepEqual(result.items[1], {
      subject: "PHYS",
      courseNumber: "1151",
    });
  });

  test("returns '??' for unknown subject name in coreqs", () => {
    const html = wrapTable(coreq3ColRow("Marine Biology", "1000"));
    const result = parseCoreqs(html, subjects) as ReqsCourse;
    assert.equal(result.subject, "??");
    assert.equal(result.courseNumber, "1000");
  });
});

// ---------- populatePostReqs ----------

describe("populatePostReqs", () => {
  test("empty courses array: no-op", () => {
    const courses: Course[] = [];
    populatePostReqs(courses);
    assert.equal(courses.length, 0);
  });

  test("single prereq chain: A requires B, B gets postreq A", () => {
    const courseB = makeCourse("CS", "2500", {});
    const courseA = makeCourse("CS", "3500", {
      subject: "CS",
      courseNumber: "2500",
    });
    const courses = [courseA, courseB];
    populatePostReqs(courses);

    const bPostReqs = courseB.postreqs as Condition;
    assert.equal(bPostReqs.type, "and");
    assert.equal(bPostReqs.items.length, 1);
    assert.deepEqual(bPostReqs.items[0], {
      subject: "CS",
      courseNumber: "3500",
    });
  });

  test("multiple courses sharing the same prereq", () => {
    const prereqCourse = makeCourse("CS", "2500", {});
    const courseA = makeCourse("CS", "3500", {
      subject: "CS",
      courseNumber: "2500",
    });
    const courseB = makeCourse("CS", "3800", {
      subject: "CS",
      courseNumber: "2500",
    });
    const courses = [courseA, courseB, prereqCourse];
    populatePostReqs(courses);

    const postreqs = prereqCourse.postreqs as Condition;
    assert.equal(postreqs.type, "and");
    assert.equal(postreqs.items.length, 2);

    const postreqKeys = postreqs.items.map((item) => {
      const course = item as ReqsCourse;
      return `${course.subject} ${course.courseNumber}`;
    });
    assert.ok(postreqKeys.includes("CS 3500"));
    assert.ok(postreqKeys.includes("CS 3800"));
  });

  test("nested prereqs (OR/AND conditions) — all leaf courses become postreq sources", () => {
    const cs2500 = makeCourse("CS", "2500", {});
    const cs2510 = makeCourse("CS", "2510", {});
    const math1341 = makeCourse("MATH", "1341", {});

    // CS 3500 requires (CS 2500 OR CS 2510) AND MATH 1341
    const cs3500 = makeCourse("CS", "3500", {
      type: "and",
      items: [
        {
          type: "or",
          items: [
            { subject: "CS", courseNumber: "2500" },
            { subject: "CS", courseNumber: "2510" },
          ],
        },
        { subject: "MATH", courseNumber: "1341" },
      ],
    });

    const courses = [cs2500, cs2510, math1341, cs3500];
    populatePostReqs(courses);

    // CS 2500 should list CS 3500 as postreq
    const cs2500Post = cs2500.postreqs as Condition;
    assert.equal(cs2500Post.type, "and");
    assert.deepEqual(cs2500Post.items[0], {
      subject: "CS",
      courseNumber: "3500",
    });

    // CS 2510 should also list CS 3500 as postreq
    const cs2510Post = cs2510.postreqs as Condition;
    assert.equal(cs2510Post.type, "and");
    assert.deepEqual(cs2510Post.items[0], {
      subject: "CS",
      courseNumber: "3500",
    });

    // MATH 1341 should also list CS 3500 as postreq
    const math1341Post = math1341.postreqs as Condition;
    assert.equal(math1341Post.type, "and");
    assert.deepEqual(math1341Post.items[0], {
      subject: "CS",
      courseNumber: "3500",
    });
  });

  test("course with no prereqs gets empty postreqs", () => {
    const courseA = makeCourse("CS", "1200", {});
    const courseB = makeCourse("CS", "1800", {});
    const courses = [courseA, courseB];
    populatePostReqs(courses);

    assert.deepEqual(courseA.postreqs, {});
    assert.deepEqual(courseB.postreqs, {});
  });
});
