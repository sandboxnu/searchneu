import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { notificationsFrom, seatHistoryIds } from "./apply";
import type { Plan, SectionInsert, SectionUpdate } from "./plan";

function planWith(
  updates: SectionUpdate[],
  inserts: SectionInsert[] = [],
): Plan {
  return {
    term: "202610",
    pass: "light",
    parts: [
      {
        partOfTerm: "1",
        termRow: {
          op: "noop",
          termId: 1,
          name: "Spring 2026",
          activeUntil: new Date("2026-05-01T00:00:00.000Z"),
        },
        courses: { insert: [], update: [] },
        sections: { insert: inserts, update: updates },
        meetingTimes: { insert: [], delete: [] },
        nupaths: { insert: [], delete: [] },
        tombstones: { courses: [], sections: [] },
        confirmed: { courses: [], sections: [] },
      },
    ],
    problems: [],
    stats: {
      courseInserts: 0,
      courseUpdates: 0,
      sectionInserts: 0,
      sectionUpdates: updates.length,
      meetingTimeInserts: 0,
      meetingTimeDeletes: 0,
      missingCourses: 0,
      missingSections: 0,
      tombstoned: 0,
      restored: 0,
      snapshotSections: 0,
      stateSections: 0,
      stateCourses: 0,
    },
  };
}

function update(
  crn: string,
  changes: SectionUpdate["changes"],
  before: SectionUpdate["before"],
): SectionUpdate {
  return { id: Number(crn), crn, changes, before };
}

function insert(crn: string): SectionInsert {
  return {
    crn,
    register: "CS2500",
    values: {
      faculty: "Lovelace, Ada",
      seatCapacity: 100,
      seatRemaining: 100,
      waitlistCapacity: 0,
      waitlistRemaining: 0,
      classType: "Lecture",
      honors: false,
      campus: 10,
    },
  };
}

describe("notificationsFrom", () => {
  test("reports a section whose seats opened", () => {
    const result = notificationsFrom(
      planWith([update("1", { seatRemaining: 3 }, { seatRemaining: 0 })]),
    );

    assert.deepEqual(result.seatOpened, [{ sectionId: 1, crn: "1" }]);
    assert.deepEqual(result.waitlistOpened, []);
  });

  test("ignores seats that merely moved", () => {
    const result = notificationsFrom(
      planWith([update("1", { seatRemaining: 4 }, { seatRemaining: 7 })]),
    );

    assert.deepEqual(result.seatOpened, []);
  });

  test("reports a waitlist that opened", () => {
    const result = notificationsFrom(
      planWith([
        update("1", { waitlistRemaining: 2 }, { waitlistRemaining: 0 }),
      ]),
    );

    assert.deepEqual(result.waitlistOpened, [{ sectionId: 1, crn: "1" }]);
  });

  test("prefers the seat notification when both opened", () => {
    const result = notificationsFrom(
      planWith([
        update(
          "1",
          { seatRemaining: 2, waitlistRemaining: 3 },
          { seatRemaining: 0, waitlistRemaining: 0 },
        ),
      ]),
    );

    assert.deepEqual(result.seatOpened, [{ sectionId: 1, crn: "1" }]);
    assert.deepEqual(result.waitlistOpened, []);
  });
});

describe("seatHistoryIds", () => {
  const part = (plan: Plan) => plan.parts[0]!;

  test("includes a section whose seats changed", () => {
    const ids = seatHistoryIds(
      part(planWith([update("1", { seatRemaining: 4 }, { seatRemaining: 7 })])),
      new Map([["1", 1]]),
    );

    assert.deepEqual(ids, [1]);
  });

  test("includes a capacity or waitlist change", () => {
    const ids = seatHistoryIds(
      part(
        planWith([
          update("1", { seatCapacity: 120 }, { seatCapacity: 100 }),
          update("2", { waitlistRemaining: 1 }, { waitlistRemaining: 2 }),
        ]),
      ),
      new Map([
        ["1", 1],
        ["2", 2],
      ]),
    );

    assert.deepEqual(ids.sort(), [1, 2]);
  });

  test("skips an update that only touches non-seat fields", () => {
    const ids = seatHistoryIds(
      part(planWith([update("1", { faculty: "Hopper, Grace" }, {})])),
      new Map([["1", 1]]),
    );

    assert.deepEqual(ids, []);
  });

  test("lists a section once when seats and other fields changed", () => {
    const ids = seatHistoryIds(
      part(
        planWith([
          update(
            "1",
            { faculty: "Hopper, Grace", seatRemaining: 3 },
            { faculty: "Lovelace, Ada", seatRemaining: 5 },
          ),
        ]),
      ),
      new Map([["1", 1]]),
    );

    assert.deepEqual(ids, [1]);
  });

  test("gives an inserted section its first row", () => {
    const ids = seatHistoryIds(
      part(planWith([], [insert("70002")])),
      new Map([["70002", 902]]),
    );

    assert.deepEqual(ids, [902]);
  });
});
