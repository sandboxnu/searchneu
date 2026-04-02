import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BannerTerm, BannerCRN } from "./common";

describe("BannerTerm", () => {
  test("accepts a 6-character string", () => {
    const result = BannerTerm.safeParse("202610");
    assert.ok(result.success);
  });

  test("rejects a string shorter than 6 characters", () => {
    const result = BannerTerm.safeParse("20261");
    assert.ok(!result.success);
  });

  test("rejects a string longer than 6 characters", () => {
    const result = BannerTerm.safeParse("2026100");
    assert.ok(!result.success);
  });

  test("rejects an empty string", () => {
    const result = BannerTerm.safeParse("");
    assert.ok(!result.success);
  });

  test("rejects a non-string value", () => {
    const result = BannerTerm.safeParse(202610);
    assert.ok(!result.success);
  });
});

describe("BannerCRN", () => {
  test("accepts a 5-character string", () => {
    const result = BannerCRN.safeParse("12345");
    assert.ok(result.success);
  });

  test("rejects a string shorter than 5 characters", () => {
    const result = BannerCRN.safeParse("1234");
    assert.ok(!result.success);
  });

  test("rejects a string longer than 5 characters", () => {
    const result = BannerCRN.safeParse("123456");
    assert.ok(!result.success);
  });

  test("rejects an empty string", () => {
    const result = BannerCRN.safeParse("");
    assert.ok(!result.success);
  });

  test("rejects a non-string value", () => {
    const result = BannerCRN.safeParse(12345);
    assert.ok(!result.success);
  });
});
