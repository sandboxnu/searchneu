import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { meetingTimesToBinaryMask, masksConflict } from "../binaryMeetingTime";
import { createMockSection } from "./mocks";

const SLOTS_PER_DAY = 288;
const MINUTES_PER_SLOT = 5;

/** Which bit stands for the slot containing `time` on `day`. */
const bitIndex = (day: number, time: number): number => {
  const minutes = Math.floor(time / 100) * 60 + (time % 100);
  return day * SLOTS_PER_DAY + Math.floor(minutes / MINUTES_PER_SLOT);
};

const isSet = (mask: bigint, bit: number): boolean =>
  (mask >> BigInt(bit)) & BigInt(1) ? true : false;

const maskOf = (
  meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }>,
): bigint => meetingTimesToBinaryMask(createMockSection(1, meetingTimes));

describe("meetingTimesToBinaryMask", () => {
  test("sets exactly the slots a meeting occupies", () => {
    // 09:35-11:15 on Monday is 100 minutes, so twenty 5-minute slots.
    const mask = maskOf([{ days: [1], startTime: 935, endTime: 1115 }]);

    let set = 0;
    for (let bit = 0; bit < SLOTS_PER_DAY * 7; bit++) {
      if (isSet(mask, bit)) set++;
    }
    assert.equal(set, 20);

    assert.ok(isSet(mask, bitIndex(1, 935)), "start slot is occupied");
    assert.ok(isSet(mask, bitIndex(1, 1110)), "last slot is occupied");
  });

  test("the end time is exclusive", () => {
    const mask = maskOf([{ days: [1], startTime: 900, endTime: 1000 }]);
    assert.ok(isSet(mask, bitIndex(1, 955)));
    assert.equal(isSet(mask, bitIndex(1, 1000)), false);
  });

  test("back-to-back meetings do not conflict", () => {
    const first = maskOf([{ days: [1], startTime: 900, endTime: 1000 }]);
    const second = maskOf([{ days: [1], startTime: 1000, endTime: 1100 }]);
    assert.equal(masksConflict(first, second), false);
  });

  test("a meeting of no length occupies nothing", () => {
    assert.equal(
      maskOf([{ days: [1], startTime: 900, endTime: 900 }]),
      BigInt(0),
    );
    // Both ends landing in the same five minutes is also no length.
    assert.equal(
      maskOf([{ days: [1], startTime: 901, endTime: 903 }]),
      BigInt(0),
    );
  });

  test("an end before its start is ignored rather than inverted", () => {
    assert.equal(
      maskOf([{ days: [1], startTime: 1100, endTime: 900 }]),
      BigInt(0),
    );
  });

  test("repeats the same block on every day listed", () => {
    const oneDay = maskOf([{ days: [1], startTime: 900, endTime: 1000 }]);
    const threeDays = maskOf([
      { days: [1, 3, 5], startTime: 900, endTime: 1000 },
    ]);

    assert.ok((threeDays & oneDay) === oneDay, "Monday block is present");
    assert.ok(isSet(threeDays, bitIndex(3, 900)));
    assert.ok(isSet(threeDays, bitIndex(5, 900)));
    assert.equal(isSet(threeDays, bitIndex(2, 900)), false);
  });

  test("days never bleed into one another", () => {
    // A meeting running to the end of Monday must not set Tuesday's first bit.
    const mask = maskOf([{ days: [1], startTime: 2300, endTime: 2400 }]);
    assert.ok(isSet(mask, bitIndex(1, 2355)));
    assert.equal(isSet(mask, bitIndex(2, 0)), false);
  });

  test("combines several meeting blocks on one section", () => {
    const mask = maskOf([
      { days: [1], startTime: 900, endTime: 1000 },
      { days: [4], startTime: 1400, endTime: 1530 },
    ]);

    assert.ok(isSet(mask, bitIndex(1, 930)));
    assert.ok(isSet(mask, bitIndex(4, 1500)));
    assert.equal(isSet(mask, bitIndex(4, 1600)), false);
  });

  test("a section with no meetings conflicts with nothing", () => {
    const asynchronous = maskOf([]);
    const lecture = maskOf([{ days: [1], startTime: 900, endTime: 1000 }]);

    assert.equal(asynchronous, BigInt(0));
    assert.equal(masksConflict(asynchronous, lecture), false);
  });
});
