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

test("XOM with range - insufficient credits", () => {
  const xomRequirement = xom(12, [range(12, "CS", 2000, 4000, [])]);
  
  const tracker = makeTracker(c.cs2800, c.cs3500); 
  
  const result = validateRequirement(xomRequirement, tracker);
  
  assert.strictEqual(result.type, "Err");
  if (result.type === "Err") {
    assert.strictEqual(result.err.type, "XOM");
    assert.strictEqual(result.err.minRequiredCredits, 12);
    assert.strictEqual(result.err.maxPossibleCredits, 8);
  }
});

