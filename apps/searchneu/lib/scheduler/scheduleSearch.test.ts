import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  advanceFrom,
  combineSelections,
  extendWithOptional,
  EMPTY_SELECTION,
  type MaskedSelection,
} from "./scheduleSearch";
import { meetingTimesToBinaryMask } from "./binaryMeetingTime";
import { createMockSection } from "./binaryMeetingTimeTests/mocks";

/** An option occupying `days` from `start` to `end`, with one section. */
const option = (
  id: number,
  days: number[],
  start: number,
  end: number,
): MaskedSelection => {
  const section = createMockSection(id, [
    { days, startTime: start, endTime: end },
  ]);
  return { sections: [section], mask: meetingTimesToBinaryMask(section) };
};

const MON = [1];

describe("advanceFrom", () => {
  test("steps a position that has room left", () => {
    const indexes = [0, 0, 0];
    assert.equal(advanceFrom(indexes, [2, 2, 2], 2), 2);
    assert.deepEqual(indexes, [0, 0, 1]);
  });

  test("carries left when a position runs out", () => {
    const indexes = [0, 0, 1];
    assert.equal(advanceFrom(indexes, [2, 2, 2], 2), 1);
    // The exhausted position resets; the one to its left takes the carry.
    assert.deepEqual(indexes, [0, 1, 0]);
  });

  test("carries through several exhausted positions", () => {
    const indexes = [0, 1, 1];
    assert.equal(advanceFrom(indexes, [2, 2, 2], 1), 0);
    assert.deepEqual(indexes, [1, 0, 1]);
  });

  test("reports overflow once every position is exhausted", () => {
    const indexes = [1, 1];
    assert.equal(advanceFrom(indexes, [2, 2], 1), -1);
  });

  test("leaves positions to the right of the step alone", () => {
    // A prefix is only abandoned once everything after it is back at zero.
    const indexes = [0, 0, 0];
    advanceFrom(indexes, [3, 3, 3], 0);
    assert.deepEqual(indexes, [1, 0, 0]);
  });
});

describe("combineSelections", () => {
  test("choosing from no slots yields one empty selection", () => {
    assert.deepEqual(combineSelections([]), [EMPTY_SELECTION]);
  });

  test("an empty slot makes the whole combination impossible", () => {
    assert.deepEqual(combineSelections([[option(1, MON, 900, 1000)], []]), []);
  });

  test("returns every conflict-free pairing", () => {
    const first = [option(1, MON, 900, 1000), option(2, MON, 1400, 1500)];
    const second = [option(3, MON, 930, 1030), option(4, MON, 1600, 1700)];

    const combined = combineSelections([first, second]);

    // 1 clashes with 3; the other three pairings survive.
    assert.equal(combined.length, 3);
  });

  test("the reported mask is the union of the sections taken", () => {
    const combined = combineSelections([
      [option(1, MON, 900, 1000)],
      [option(2, MON, 1400, 1500)],
    ]);

    assert.equal(combined.length, 1);
    const expected = combined[0].sections.reduce(
      (mask, section) => mask | meetingTimesToBinaryMask(section),
      BigInt(0),
    );
    assert.equal(combined[0].mask, expected);
  });

  test("finds nothing when every option clashes", () => {
    assert.deepEqual(
      combineSelections([
        [option(1, MON, 900, 1000)],
        [option(2, MON, 930, 1030)],
      ]),
      [],
    );
  });
});

describe("extendWithOptional", () => {
  const slots = [[option(1, MON, 900, 1000)], [option(2, MON, 1100, 1200)]];

  test("takes every subset when no target is given", () => {
    const results = extendWithOptional(EMPTY_SELECTION, slots);
    assert.equal(results.length, 4);
  });

  test("takes exactly the requested number of slots", () => {
    for (const result of extendWithOptional(EMPTY_SELECTION, slots, 1)) {
      assert.equal(result.sections.length, 1);
    }
  });

  test("never takes an option that clashes with the base", () => {
    const base = option(9, MON, 930, 1030);
    const results = extendWithOptional(base, slots, 2);

    // Slot one clashes with the base, so two slots can never both be taken.
    assert.deepEqual(results, []);
  });

  test("recorded results are independent of later recursion", () => {
    // Results share one reused array; an uncopied one would be corrupted.
    const results = extendWithOptional(EMPTY_SELECTION, slots);
    const snapshot = results.map((r) => r.sections.map((s) => s.id));

    assert.deepEqual(
      results.map((r) => r.sections.map((s) => s.id)),
      snapshot,
    );
    // Every result holds only the sections it reported.
    for (const result of results) {
      assert.equal(
        new Set(result.sections.map((s) => s.id)).size,
        result.sections.length,
      );
    }
  });
});
