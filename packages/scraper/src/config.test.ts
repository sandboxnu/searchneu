import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TermConfig, ManifestConfig, PartOfTermConfig } from "./config.js";

describe("TermConfig", () => {
  test("valid: minimal with only required fields", () => {
    const result = TermConfig.safeParse({ term: 202510, activeUntil: "2025-12-31" });
    assert.equal(result.success, true);
  });

  test("valid: full object with all optional fields", () => {
    const result = TermConfig.safeParse({
      term: 202510,
      name: "Fall 2025",
      activeUntil: "2025-12-31",
      splitByPartOfTerm: true,
      parts: [{ code: "A", name: "Part A", activeUntil: "2025-10-15" }],
    });
    assert.equal(result.success, true);
  });

  test("invalid: missing term", () => {
    const result = TermConfig.safeParse({ activeUntil: "2025-12-31" });
    assert.equal(result.success, false);
  });

  test("invalid: missing activeUntil", () => {
    const result = TermConfig.safeParse({ term: 202510 });
    assert.equal(result.success, false);
  });

  test("invalid: term is string instead of int", () => {
    const result = TermConfig.safeParse({ term: "202510", activeUntil: "2025-12-31" });
    assert.equal(result.success, false);
  });

  test("invalid: extra unknown field rejected by strictObject", () => {
    const result = TermConfig.safeParse({
      term: 202510,
      activeUntil: "2025-12-31",
      unknownField: true,
    });
    assert.equal(result.success, false);
  });
});

describe("ManifestConfig", () => {
  test("valid: terms array with one entry", () => {
    const result = ManifestConfig.safeParse({
      terms: [{ term: 202510, activeUntil: "2025-12-31" }],
    });
    assert.equal(result.success, true);
  });

  test("invalid: terms is not an array", () => {
    const result = ManifestConfig.safeParse({ terms: "not-an-array" });
    assert.equal(result.success, false);
  });
});

describe("PartOfTermConfig", () => {
  test("valid: minimal with only code", () => {
    const result = PartOfTermConfig.safeParse({ code: "A" });
    assert.equal(result.success, true);
  });

  test("valid: with optional name and activeUntil", () => {
    const result = PartOfTermConfig.safeParse({
      code: "A",
      name: "Part A",
      activeUntil: "2025-10-15",
    });
    assert.equal(result.success, true);
  });
});
