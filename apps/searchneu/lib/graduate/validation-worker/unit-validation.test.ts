import { test, describe } from "node:test";
import assert from "node:assert";
import {
  makeTracker,
  range,
  solution,
  xom,
  or,
  and,
  section,
} from "./test-utils";
import { validateRequirement } from "./major-validation";
import * as c from "./mock-courses";
import { Ok } from "../types";

describe("validate range requirement", () => {
  test("range requirement pass", () => {
    // Create a range requirement: need 8 credits from CS courses numbered 2000-3000
    const rangeRequirement = range(8, "CS", 2000, 3000, []);

    // took CS2800, CS2810 (both in range)
    const tracker = makeTracker(c.cs2800, c.cs2810, c.ds3000, c.cs3500);

    // Should return Ok with solutions containing only CS2800 and CS2810
    assert.deepStrictEqual(
      validateRequirement(rangeRequirement, tracker),
      Ok([
        solution(c.cs2800),
        solution("CS2800", "CS2810"),
        solution(c.cs2810),
      ]),
    );
  });

  test("range requirement filters out of range courses", () => {
    // Range is CS 2000-4000, but CS2500 is excluded
    const rangeRequirement = range(8, "CS", 2000, 4000, [c.cs2500]);

    // took CS3500 (in range)
    const tracker = makeTracker(c.cs1200, c.cs4300, c.cs3500);

    // Only CS3500 should be included
    assert.deepStrictEqual(
      validateRequirement(rangeRequirement, tracker),
      Ok([solution(c.cs3500)]),
    );
  });
});

describe("validate XOM with range requirement", () => {
  test("XOM with range - sufficient credits", () => {
    const rangeRequirement = range(8, "CS", 2000, 3000, []);
    const xomRequirement = xom(8, [rangeRequirement]);

    // took CS2800 and CS2810
    const tracker = makeTracker(c.cs2800, c.cs2810, c.ds3000, c.cs3500);

    const result = validateRequirement(xomRequirement, tracker);

    // Should succeed
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      // Verify at least one solution has >= 8 credits
      const hasValidSolution = result.ok.some((sol) => sol.minCredits >= 8);
      assert.strictEqual(hasValidSolution, true);
    }
  });

  test("XOM with range - insufficient credits", () => {
    // range is: CS 2000-3000 courses
    const rangeRequirement = range(8, "CS", 2000, 3000, []);
    const xomRequirement = xom(12, [rangeRequirement]);

    // only took CS2800, which is not enough
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(xomRequirement, tracker);

    // fails because we need 12 credits but only have 4
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "XOM");
      assert.strictEqual(result.err.minRequiredCredits, 12);
      assert.strictEqual(result.err.maxPossibleCredits, 4); // Only achieved 4 credits
    }
  });
});

describe("validate all error types", () => {
  test("CourseError - required course not taken", () => {
    // Student took CS2800 and CS3500, but not CS2500
    const tracker = makeTracker(c.cs2800, c.cs3500);

    // Try to validate that CS2500 was taken
    const result = validateRequirement(c.cs2500, tracker);

    // Should fail with CourseError because CS2500 is missing
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "COURSE");
      assert.strictEqual(result.err.requiredCourse, "CS2500");
    }
  });

  test("AndError - unsatisfied child requirement", () => {
    // AND requires BOTH CS2500 AND CS2800
    const andRequirement = and(c.cs2500, c.cs2800);

    // Student only took CS2800 (missing CS2500)
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(andRequirement, tracker);

    // Should fail because one child (CS2500) is unsatisfied
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "AND");
      assert.ok(result.err.error.type === "AND_UNSAT_CHILD");
    }
  });

  test("AndError - no valid solution (courses conflict)", () => {
    // AND requires:
    // - Child 1: CS2800 OR CS2500
    // - Child 2: CS2800 OR CS3500
    const andRequirement = and(or(c.cs2800, c.cs2500), or(c.cs2800, c.cs3500));

    // Student only took CS2800 once (but both children want to use it!)
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(andRequirement, tracker);

    // Should fail because there's no valid solution:
    // - Both ORs can be satisfied individually
    // - But we can't use CS2800 for BOTH at the same time (only took it once)
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "AND");
      assert.ok(
        result.err.error.type === "AND_NO_SOLUTION" ||
          result.err.error.type === "AND_UNSAT_CHILD_AND_NO_SOLUTION",
      );
    }
  });

  test("OrError - all options fail", () => {
    // OR requires at least one of: CS2500, CS2800, or CS3500
    const orRequirement = or(c.cs2500, c.cs2800, c.cs3500);

    // Student took CS4500 instead (doesn't match any option)
    const tracker = makeTracker(c.cs4500);

    const result = validateRequirement(orRequirement, tracker);

    // Should fail because ALL three options failed
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "OR");
      assert.strictEqual(result.err.childErrors.length, 3); // All 3 options failed
    }
  });

  test("XOMError - insufficient credits", () => {
    // XOM requires 12 credits from CS 2000-4000 range
    const xomRequirement = xom(12, [range(12, "CS", 2000, 4000, [])]);

    // Student only took CS2800 (4 credits)
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(xomRequirement, tracker);

    // Should fail because we need 12 credits but only have 4
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "XOM");
      assert.strictEqual(result.err.minRequiredCredits, 12); // Need this much
      assert.strictEqual(result.err.maxPossibleCredits, 4); // Only have this much
    }
  });

  test("SectionError - insufficient requirements satisfied", () => {
    // Section requires 3 out of 4 courses to be taken
    const sectionRequirement = section(
      "Core Requirements",
      3, // Need 3 out of 4
      [c.cs2500, c.cs2800, c.cs3500, c.cs4500],
    );

    // Student only took CS2800 (1 out of 4)
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(sectionRequirement, tracker);

    // Should fail because only 1 requirement satisfied, but need 3
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "SECTION");
      assert.strictEqual(result.err.sectionTitle, "Core Requirements");
      assert.strictEqual(result.err.minRequiredChildCount, 3); // Need 3
      assert.strictEqual(result.err.maxPossibleChildCount, 1); // Only got 1
    }
  });

  test("SectionError - no requirements satisfied", () => {
    // Section requires 2 out of 3 courses
    const sectionRequirement = section(
      "Electives",
      2, // Need 2 out of 3
      [c.cs2500, c.cs3500, c.cs4500],
    );

    // took CS2800 (not in the section at all)
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(sectionRequirement, tracker);

    // fails because 0 requirements satisfied, but need 2
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "SECTION");
      assert.strictEqual(result.err.minRequiredChildCount, 2); // Need 2
      assert.strictEqual(result.err.maxPossibleChildCount, 0); // Got 0
    }
  });
});

describe("validate successful requirements", () => {
  test("CourseRequirement - course taken successfully", () => {
    // took CS2500, CS2800, CS3500
    const tracker = makeTracker(c.cs2500, c.cs2800, c.cs3500);

    // check that CS2500 was taken
    const result = validateRequirement(c.cs2500, tracker);

    // Should pass with solution containing CS2500
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      assert.deepStrictEqual(result.ok, [solution(c.cs2500)]);
    }
  });

  test("AndRequirement - all children satisfied", () => {
    // AND requires CS2500 and CS2800
    const andRequirement = and(c.cs2500, c.cs2800);

    // Student took both courses
    const tracker = makeTracker(c.cs2500, c.cs2800);

    const result = validateRequirement(andRequirement, tracker);

    // Should succeed with solution containing both courses
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      assert.deepStrictEqual(result.ok, [solution(c.cs2500, c.cs2800)]);
    }
  });

  test("AndRequirement - multiple valid solutions", () => {
    // AND requires:
    // - Child 1: CS2800 OR CS2500
    // - Child 2: CS3500 OR CS4500
    const andRequirement = and(or(c.cs2800, c.cs2500), or(c.cs3500, c.cs4500));

    // Student took all four courses
    const tracker = makeTracker(c.cs2800, c.cs2500, c.cs3500, c.cs4500);

    const result = validateRequirement(andRequirement, tracker);

    // Should succeed with multiple valid combinations
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      // Should have 4 solutions: (CS2800,CS3500), (CS2800,CS4500), (CS2500,CS3500), (CS2500,CS4500)
      assert.strictEqual(result.ok.length, 4);
    }
  });

  test("OrRequirement - one option satisfied", () => {
    // OR requires at least CS2500, CS2800, or CS3500
    const orRequirement = or(c.cs2500, c.cs2800, c.cs3500);

    // Student took CS2800
    const tracker = makeTracker(c.cs2800);

    const result = validateRequirement(orRequirement, tracker);

    // Should succeed with CS2800 as solution
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      assert.deepStrictEqual(result.ok, [solution(c.cs2800)]);
    }
  });

  test("OrRequirement - multiple options satisfied", () => {
    // OR requires at least one of: CS2500, CS2800, or CS3500
    const orRequirement = or(c.cs2500, c.cs2800, c.cs3500);

    // Student took all three (all options satisfied)
    const tracker = makeTracker(c.cs2500, c.cs2800, c.cs3500);

    const result = validateRequirement(orRequirement, tracker);

    // Should succeed with all three as separate solutions
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      assert.strictEqual(result.ok.length, 3); // Three valid solutions
    }
  });

  test("SectionRequirement - minimum requirements met", () => {
    // Section requires 2 out of 3 courses
    const sectionRequirement = section(
      "Electives",
      2, // Need 2 out of 3
      [c.cs2500, c.cs3500, c.cs4500],
    );

    // Student took exactly 2 courses (CS2500 and CS3500)
    const tracker = makeTracker(c.cs2500, c.cs3500);

    const result = validateRequirement(sectionRequirement, tracker);

    // Should succeed because 2 requirements are satisfied
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      // At least one solution should exist
      assert.ok(result.ok.length > 0);
    }
  });

  test("SectionRequirement - all requirements satisfied", () => {
    // Section requires 2 out of 4 courses
    const sectionRequirement = section(
      "Core Requirements",
      2, // Need 2 out of 4
      [c.cs2500, c.cs2800, c.cs3500, c.cs4500],
    );

    // Student took all 4 courses (exceeds requirement)
    const tracker = makeTracker(c.cs2500, c.cs2800, c.cs3500, c.cs4500);

    const result = validateRequirement(sectionRequirement, tracker);

    // Should succeed with multiple valid combinations
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      // Should have multiple solutions (different pairs of courses)
      assert.ok(result.ok.length > 0);
    }
  });
});
