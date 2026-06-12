import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BannerTerms, BannerTermsResponse } from "./terms";

describe("BannerTerms", () => {
  test("accepts a valid term with a 6-character code", () => {
    const result = BannerTerms.safeParse({
      code: "202610",
      description: "Spring 2026",
    });
    assert.ok(result.success);
  });

  test("rejects a code shorter than 6 characters", () => {
    const result = BannerTerms.safeParse({
      code: "20261",
      description: "Spring 2026",
    });
    assert.ok(!result.success);
  });

  test("rejects a code longer than 6 characters", () => {
    const result = BannerTerms.safeParse({
      code: "2026100",
      description: "Spring 2026",
    });
    assert.ok(!result.success);
  });

  test("rejects missing description", () => {
    const result = BannerTerms.safeParse({
      code: "202610",
    });
    assert.ok(!result.success);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = BannerTerms.safeParse({
      code: "202610",
      description: "Spring 2026",
      extra: "field",
    });
    assert.ok(!result.success);
  });
});

describe("BannerTermsResponse", () => {
  test("accepts an array of valid terms", () => {
    const result = BannerTermsResponse.safeParse([
      { code: "202610", description: "Spring 2026" },
      { code: "202530", description: "Fall 2025" },
    ]);
    assert.ok(result.success);
  });

  test("accepts an empty array", () => {
    const result = BannerTermsResponse.safeParse([]);
    assert.ok(result.success);
  });

  test("rejects if any term in the array is invalid", () => {
    const result = BannerTermsResponse.safeParse([
      { code: "202610", description: "Spring 2026" },
      { code: "BAD", description: "Invalid" },
    ]);
    assert.ok(!result.success);
  });
});
