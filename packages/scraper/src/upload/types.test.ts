import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { chunk } from "./types";

describe("chunk", () => {
  test("empty array returns empty array", () => {
    assert.deepStrictEqual(chunk([], 2), []);
  });

  test("array divides evenly", () => {
    assert.deepStrictEqual(chunk([1, 2, 3, 4], 2), [
      [1, 2],
      [3, 4],
    ]);
  });

  test("array with remainder", () => {
    assert.deepStrictEqual(chunk([1, 2, 3, 4, 5], 2), [
      [1, 2],
      [3, 4],
      [5],
    ]);
  });

  test("single element array", () => {
    assert.deepStrictEqual(chunk([42], 3), [[42]]);
  });

  test("size larger than array returns single chunk", () => {
    assert.deepStrictEqual(chunk([1, 2, 3], 10), [[1, 2, 3]]);
  });

  test("size of 1 returns array of single-element arrays", () => {
    assert.deepStrictEqual(chunk([1, 2, 3], 1), [[1], [2], [3]]);
  });
});
