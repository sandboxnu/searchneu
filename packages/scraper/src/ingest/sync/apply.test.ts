import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { notificationsFrom } from "./apply";
import type { Plan, SectionUpdate } from "./plan";

function planWith(updates: SectionUpdate[]): Plan {
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
        sections: { insert: [], update: updates },
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
