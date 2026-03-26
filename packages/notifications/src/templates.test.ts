import assert from "node:assert";
import { describe, test } from "node:test";
import { renderMessage } from "./templates";
import type { Notif } from "./types";

const notif: Notif = {
  id: 1,
  term: "202510",
  sectionCrn: "12345",
  uid: "user-1",
  method: "SMS",
  count: 0,
  limit: 3,
  courseSubject: "CS",
  courseNumber: "3500",
  phoneNumber: "+11234567890",
  phoneNumberVerified: true,
};

describe("renderMessage", () => {
  test("seats_opened", () => {
    const msg = renderMessage("seats_opened", notif);
    assert.strictEqual(
      msg,
      "A seat opened up in CS 3500 (CRN: 12345). Check it out at https://searchneu.com/catalog/202510/CS%203500 !",
    );
  });

  test("seats_two_remaining", () => {
    const msg = renderMessage("seats_two_remaining", notif);
    assert.strictEqual(
      msg,
      "Only 2 seats remaining in CS 3500 (CRN: 12345). Check it out at https://searchneu.com/catalog/202510/CS%203500 !",
    );
  });

  test("seats_one_remaining", () => {
    const msg = renderMessage("seats_one_remaining", notif);
    assert.strictEqual(
      msg,
      "Only 1 seat remaining in CS 3500 (CRN: 12345). Check it out at https://searchneu.com/catalog/202510/CS%203500 !",
    );
  });

  test("waitlist_opened", () => {
    const msg = renderMessage("waitlist_opened", notif);
    assert.strictEqual(
      msg,
      "A waitlist seat has opened up in CS 3500 (CRN: 12345). Check it out at https://searchneu.com/catalog/202510/CS%203500 !",
    );
  });
});
