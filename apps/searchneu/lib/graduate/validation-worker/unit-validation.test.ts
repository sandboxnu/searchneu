import { test, describe } from "node:test";
import assert from "node:assert";
import { makeTracker, range, solution, xom } from "./test-utils";
import { CourseError, validateRequirement } from "./major2-validation";
import * as c from "./mock-courses";
import { Err, Ok } from "../types";

describe("validate range requirement", () => {
  test("range requirement pass", () => {
    const rangeRequirement = range(8, "CS", 2000, 3000, []);
    const tracker = makeTracker(c.cs2800, c.cs2810, c.ds3000, c.cs3500);
    console.log(validateRequirement(rangeRequirement, tracker));
    assert.deepStrictEqual(validateRequirement(rangeRequirement, tracker),
      Ok([solution(c.cs2800), solution("CS2800", "CS2810"), solution(c.cs2810)]),
    );
  });
  test("range requirement fail", () => {
    const rangeRequirement = range(8, "CS", 2000, 4000, [c.cs2500])
    const tracker = makeTracker(c.cs1200, c.cs4300, c.cs3500);
    console.log(validateRequirement(rangeRequirement, tracker));
    assert.deepStrictEqual(validateRequirement(rangeRequirement, tracker),
    Ok([solution(c.cs3500)]),
    );
  })
});

describe("validate XOM with range requirement", () => {
  test("XOM with range - sufficient credits", () => {
    // Range gives us CS2800 (4) and CS2810 (4) = 8 credits total
    const rangeRequirement = range(8, "CS", 2000, 3000, []);
    const xomRequirement = xom(8, [rangeRequirement]); // the requirement needs 8 credits
    
    const tracker = makeTracker(c.cs2800, c.cs2810, c.ds3000, c.cs3500);
    
    const result = validateRequirement(xomRequirement, tracker);
    
    assert.strictEqual(result.type, "Ok");
    if (result.type === "Ok") {
      // checks if at least one colution made has a min credit of 8
      const hasValidSolution = result.ok.some(sol => sol.minCredits >= 8);
      assert.strictEqual(hasValidSolution, true);
    }
  });

  test("XOM with range - insufficient credits", () => {
    // Range gives us only CS2800 (4 credits)
    const rangeRequirement = range(8, "CS", 2000, 3000, []);
    const xomRequirement = xom(12, [rangeRequirement]); // the requirement needs 12 credits
    
    const tracker = makeTracker(c.cs2800); // Only 4 credits available
    
    const result = validateRequirement(xomRequirement, tracker);
    
    // Don't have enough credits
    assert.strictEqual(result.type, "Err");
    if (result.type === "Err") {
      assert.strictEqual(result.err.type, "XOM");
      assert.strictEqual(result.err.minRequiredCredits, 12);
      assert.strictEqual(result.err.maxPossibleCredits, 4);
    }
  });
});