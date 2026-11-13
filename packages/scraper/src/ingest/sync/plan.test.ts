import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { plan, type PassKind, type TermPlanConfig } from "./plan";
import type { TermState } from "./state";
import { TOMBSTONE } from "../config";
import { assemble } from "../assemble";
import { bannerSection, meetingsFaculty, sweepOf } from "../testing";
import { courseRow, meetingRow, sectionRow, termState } from "./testing";
import type { TermSnapshot } from "../../schemas/scraper/snapshot";

const NOW = new Date("2026-02-01T00:00:00.000Z");

const config: TermPlanConfig = {
  name: "Spring 2026",
  activeUntil: new Date("2026-05-01T00:00:00.000Z"),
};

/** A deep plan treats every course in the snapshot as scraped. */
function run(
  snapshot: TermSnapshot,
  state: TermState,
  pass: PassKind = "deep",
  planConfig = config,
) {
  return plan(snapshot, state, planConfig, {
    pass,
    now: NOW,
    tombstone: TOMBSTONE,
    scraped: new Set(snapshot.courses.map((c) => c.subject + c.courseNumber)),
  });
}

/** What a scrape of the one-section fixture returns. */
function scraped(snapshot: TermSnapshot): TermSnapshot {
  return {
    ...snapshot,
    courses: snapshot.courses.map((c) => ({
      ...c,
      name: "Fundamentals of Computer Science 1",
      description: "A course.",
    })),
    sections: Object.fromEntries(
      Object.entries(snapshot.sections).map(([register, list]) => [
        register,
        list.map((s) => ({
          ...s,
          faculty: [
            { displayName: "Lovelace, Ada", email: null, primary: true },
          ],
        })),
      ]),
    ),
  };
}

const oneSection = () =>
  scraped(
    assemble(sweepOf([bannerSection({ courseReferenceNumber: "70001" })])),
  );

/** The catalog exactly as a scrape of `oneSection` would leave it. */
const settled = () =>
  termState({
    parts: [{ courses: [courseRow()], sections: [sectionRow()] }],
  });

describe("plan", () => {
  test("is empty against the state it would produce", () => {
    // the headline property: a settled term plans no writes
    for (const pass of ["light", "deep"] as const) {
      const part = run(oneSection(), settled(), pass).parts[0];

      assert.deepEqual(part.courses, { insert: [], update: [] });
      assert.deepEqual(part.sections, { insert: [], update: [] });
      assert.deepEqual(part.meetingTimes, { insert: [], delete: [] });
      assert.equal(part.termRow.op, "noop");
    }
  });

  describe("light plans", () => {
    test("write seats and waitlists", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow()],
            sections: [sectionRow({ seatRemaining: 0, waitlistRemaining: 0 })],
          },
        ],
      });

      const [update] = run(oneSection(), state, "light").parts[0].sections
        .update;

      assert.deepEqual(update.changes, {
        seatRemaining: 10,
        waitlistRemaining: 15,
      });
      assert.deepEqual(update.before, {
        seatRemaining: 0,
        waitlistRemaining: 0,
      });
    });

    test("write nothing else, even when the sweep disagrees", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow({ description: "Old.", minCredits: "1" })],
            sections: [sectionRow({ faculty: "Someone", classType: "Lab" })],
          },
        ],
      });

      const part = run(oneSection(), state, "light").parts[0];

      assert.deepEqual(part.courses.update, []);
      assert.deepEqual(part.sections.update, []);
      assert.deepEqual(part.confirmed, { courses: [], sections: [] });
    });

    test("insert nothing, leaving new rows to a scrape", () => {
      const result = run(oneSection(), termState(), "light");

      assert.deepEqual(result.parts[0].courses.insert, []);
      assert.deepEqual(result.parts[0].sections.insert, []);
      assert.deepEqual(result.problems, []);
    });

    test("mark a section Banner stopped listing", () => {
      const state = termState({
        parts: [
          { courses: [courseRow()], sections: [sectionRow({ crn: "99999" })] },
        ],
      });

      const [change] = run(oneSection(), state, "light").parts[0].tombstones
        .sections;

      assert.equal(change.action, "mark");
      assert.equal(change.key, "99999");
    });
  });

  describe("deep plans", () => {
    test("write every field of a scraped course", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow({ description: "Stale.", minCredits: "1" })],
            sections: [sectionRow({ faculty: "Someone", classType: "Lab" })],
          },
        ],
      });

      const part = run(oneSection(), state).parts[0];

      assert.deepEqual(part.courses.update[0].changes, {
        description: "A course.",
        minCredits: "4",
      });
      assert.deepEqual(part.sections.update[0].changes, {
        faculty: "Lovelace, Ada",
        classType: "Lecture",
      });
    });

    test("leave a course that was not scraped alone", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow({ description: "Stale." })],
            sections: [sectionRow({ faculty: "Someone" })],
          },
        ],
      });

      const result = plan(oneSection(), state, config, {
        pass: "deep",
        now: NOW,
        tombstone: TOMBSTONE,
        scraped: new Set(),
      });

      assert.deepEqual(result.parts[0].courses.update, []);
      assert.deepEqual(result.parts[0].sections.update, []);
    });

    test("confirm a scraped course and its sections, even unchanged", () => {
      const part = run(oneSection(), settled()).parts[0];

      assert.deepEqual(part.confirmed, { courses: [100], sections: [200] });
    });

    test("insert a new course and its section by natural key", () => {
      const part = run(oneSection(), termState()).parts[0];

      assert.deepEqual(
        part.courses.insert.map((c) => c.register),
        ["CS2500"],
      );
      assert.equal(part.courses.insert[0].subjectId, 1);
      assert.deepEqual(
        part.sections.insert.map((s) => [s.crn, s.register]),
        [["70001", "CS2500"]],
      );
    });

    test("leave tombstones to the light plan", () => {
      const state = termState({
        parts: [
          { courses: [courseRow()], sections: [sectionRow({ crn: "99999" })] },
        ],
      });

      assert.deepEqual(run(oneSection(), state).parts[0].tombstones, {
        courses: [],
        sections: [],
      });
    });

    test("replace a meeting time that changed room", () => {
      const snapshot = scraped(
        assemble(
          sweepOf([
            bannerSection({
              courseReferenceNumber: "70001",
              meetingsFaculty: [meetingsFaculty("70001", { room: "011" })],
            }),
          ]),
        ),
      );
      const state = termState({
        parts: [
          {
            courses: [courseRow()],
            sections: [sectionRow()],
            meetingTimes: [meetingRow()],
          },
        ],
      });

      const part = run(snapshot, state).parts[0];

      assert.deepEqual(
        part.meetingTimes.insert.map((m) => [m.building, m.room]),
        [["SN", "011"]],
      );
      assert.deepEqual(part.meetingTimes.delete, [300]);
    });

    describe("a hybrid section Banner lists twice, with and without a room", () => {
      const hybrid = () =>
        scraped(
          assemble(
            sweepOf([
              bannerSection({
                courseReferenceNumber: "70001",
                // the roomless copy first, so the room has to win on merit
                meetingsFaculty: [
                  meetingsFaculty("70001", { building: null, room: null }),
                  meetingsFaculty("70001"),
                ],
              }),
            ]),
          ),
        );

      test("plans nothing once the roomed meeting is stored", () => {
        const state = termState({
          parts: [
            {
              courses: [courseRow()],
              sections: [sectionRow()],
              meetingTimes: [meetingRow()],
            },
          ],
        });

        assert.deepEqual(run(hybrid(), state).parts[0].meetingTimes, {
          insert: [],
          delete: [],
        });
      });

      test("inserts only the roomed meeting for a new section", () => {
        const part = run(hybrid(), termState()).parts[0];

        assert.deepEqual(
          part.meetingTimes.insert.map((m) => [m.building, m.room]),
          [["SN", "108"]],
        );
      });
    });

    test("skip final exams when planning meeting times", () => {
      const base = oneSection();
      const withFinal: TermSnapshot = {
        ...base,
        sections: {
          CS2500: base.sections["CS2500"].map((s) => ({
            ...s,
            meetingTimes: [
              {
                building: "SN",
                buildingDescription: "Snell",
                room: "108",
                campus: "BOS",
                campusDescription: "Boston",
                days: [5],
                startTime: 800,
                endTime: 1000,
                final: true,
                finalDate: "04/25/2026",
              },
            ],
          })),
        },
      };

      assert.deepEqual(
        run(withFinal, settled()).parts[0].meetingTimes.insert,
        [],
      );
    });

    test("add a nupath join the course attributes imply", () => {
      const base = oneSection();
      const snapshot: TermSnapshot = {
        ...base,
        courses: base.courses.map((c) => ({
          ...c,
          attributes: ["NCND", "ZZZZ"],
        })),
      };

      assert.deepEqual(run(snapshot, settled()).parts[0].nupaths.insert, [
        { register: "CS2500", nupathId: 40 },
      ]);
    });

    test("drop a nupath join the attributes no longer imply", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow()],
            sections: [sectionRow()],
            nupaths: [[100, [40]]],
          },
        ],
      });

      assert.deepEqual(run(oneSection(), state).parts[0].nupaths.delete, [
        { courseId: 100, nupathId: 40 },
      ]);
    });
  });

  describe("unresolvable references", () => {
    test("report an unknown subject and skip the course", () => {
      const state = termState({ lookups: { subjects: new Map() } });
      const result = run(oneSection(), state);

      assert.deepEqual(
        result.problems.map((p) => p.kind),
        ["unknown-subject"],
      );
      assert.deepEqual(result.parts[0].courses.insert, []);
    });

    test("report an unknown campus and skip the section", () => {
      const state = termState({ lookups: { campusesByName: new Map() } });
      const result = run(oneSection(), state);

      assert.deepEqual(
        result.problems.map((p) => p.kind),
        ["unknown-campus"],
      );
      assert.deepEqual(result.parts[0].sections.insert, []);
    });

    test("never stop a light plan, which needs no lookups", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow()],
            sections: [sectionRow({ seatRemaining: 0 })],
          },
        ],
        lookups: { subjects: new Map(), campusesByName: new Map() },
      });

      const result = run(oneSection(), state, "light");

      assert.deepEqual(result.problems, []);
      assert.equal(result.parts[0].sections.update.length, 1);
    });

    test("report a section that changed course", () => {
      const state = termState({
        parts: [
          {
            courses: [courseRow({ id: 100 })],
            sections: [sectionRow({ courseId: 999 })],
          },
        ],
      });

      assert.deepEqual(
        run(oneSection(), state).problems.map((p) => p.kind),
        ["section-course-moved"],
      );
    });
  });

  describe("parts of term", () => {
    const twoParts = () =>
      scraped(
        assemble(
          sweepOf([
            bannerSection({ courseReferenceNumber: "70001", partOfTerm: "A" }),
            bannerSection({ courseReferenceNumber: "70002", partOfTerm: "B" }),
          ]),
        ),
      );

    test("fan out across the parts the sweep found", () => {
      const state = termState({
        parts: [
          { partOfTerm: "A", termId: 1 },
          { partOfTerm: "B", termId: 2 },
        ],
      });

      const result = run(twoParts(), state, "deep", {
        ...config,
        splitByPartOfTerm: true,
      });

      assert.deepEqual(
        result.parts.map((p) => p.sections.insert.map((s) => s.crn)),
        [["70001"], ["70002"]],
      );
    });

    test("put everything under one part when not splitting", () => {
      const result = run(twoParts(), termState());

      assert.equal(result.parts.length, 1);
      assert.equal(result.parts[0].sections.insert.length, 2);
    });
  });

  describe("stats", () => {
    test("count every swept section on both plans", () => {
      // a deep plan writes few courses, but the rails compare whole terms
      const state = termState({
        parts: [{ courses: [courseRow()], sections: [sectionRow()] }],
      });

      for (const pass of ["light", "deep"] as const) {
        const result = plan(oneSection(), state, config, {
          pass,
          now: NOW,
          tombstone: TOMBSTONE,
          scraped: new Set(),
        });
        assert.equal(result.stats.snapshotSections, 1);
        assert.equal(result.stats.stateSections, 1);
      }
    });

    test("leave tombstoned rows out of the term's size", () => {
      const gone = new Date("2026-01-01T00:00:00.000Z");
      const state = termState({
        parts: [
          {
            courses: [
              courseRow(),
              courseRow({ id: 101, register: "CS9999", tombstonedAt: gone }),
            ],
            sections: [
              sectionRow(),
              sectionRow({ id: 201, crn: "79999", tombstonedAt: gone }),
            ],
          },
        ],
      });

      const stats = run(oneSection(), state, "light").stats;

      assert.equal(stats.stateSections, 1);
      assert.equal(stats.stateCourses, 1);
    });
  });
});
