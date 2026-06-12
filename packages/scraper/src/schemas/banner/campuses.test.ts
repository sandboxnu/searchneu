import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BannerCampuses, BannerCampusesResponse } from "./campuses";

describe("BannerCampuses", () => {
  test("accepts a valid campus with a 3-character code", () => {
    const result = BannerCampuses.safeParse({
      code: "BOS",
      description: "Boston",
    });
    assert.ok(result.success);
  });

  test("rejects a code shorter than 3 characters", () => {
    const result = BannerCampuses.safeParse({
      code: "BO",
      description: "Boston",
    });
    assert.ok(!result.success);
  });

  test("rejects a code longer than 3 characters", () => {
    const result = BannerCampuses.safeParse({
      code: "BOST",
      description: "Boston",
    });
    assert.ok(!result.success);
  });

  test("rejects missing description", () => {
    const result = BannerCampuses.safeParse({
      code: "BOS",
    });
    assert.ok(!result.success);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = BannerCampuses.safeParse({
      code: "BOS",
      description: "Boston",
      extra: "field",
    });
    assert.ok(!result.success);
  });
});

describe("BannerCampusesResponse", () => {
  test("accepts an array of valid campuses", () => {
    const result = BannerCampusesResponse.safeParse([
      { code: "BOS", description: "Boston" },
      { code: "OAK", description: "Oakland" },
    ]);
    assert.ok(result.success);
  });

  test("accepts an empty array", () => {
    const result = BannerCampusesResponse.safeParse([]);
    assert.ok(result.success);
  });

  test("rejects if any campus in the array is invalid", () => {
    const result = BannerCampusesResponse.safeParse([
      { code: "BOS", description: "Boston" },
      { code: "TOOLONG", description: "Invalid" },
    ]);
    assert.ok(!result.success);
  });
});
