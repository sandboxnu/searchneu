import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { assemble } from "./assemble";
import type { SweepResult } from "./sweep";
import { arrangeCourses } from "../generate/marshall";
import {
  bannerSection,
  meetingsFaculty,
  sectionAttribute,
  sweepOf as baseSweep,
} from "./testing";
import type { z } from "zod";
import type { BannerSection } from "../schemas/banner/section";

function sweepOf(sections: z.infer<typeof BannerSection>[]): SweepResult {
  return {
    ...baseSweep(sections),
    subjects: [{ code: "CS", description: "Computer &amp; Science" }],
  };
}

describe("assemble", () => {
  test("stamps the snapshot with the sweep's finish time, not the wall clock", () => {
    const snapshot = assemble(sweepOf([bannerSection()]));

    assert.equal(snapshot.timestamp, "2026-01-05T00:01:00.000Z");
  });

  describe("special topics", () => {
    test("detects them from a TOPC attribute on a later section", () => {
      const snapshot = assemble(
        sweepOf([
          bannerSection({
            courseReferenceNumber: "30001",
            courseNumber: "4970",
            courseTitle: "Robotics",
          }),
          bannerSection({
            courseReferenceNumber: "30002",
            courseNumber: "4970",
            courseTitle: "Computer Vision",
            sectionAttributes: [sectionAttribute("30002", "TOPC", "Topics")],
          }),
        ]),
      );

      assert.equal(snapshot.courses[0].specialTopics, true);
      assert.equal(snapshot.courses[0].name, "Special Topics");
    });
  });

  test("decodes HTML entities in subject names", () => {
    const snapshot = assemble(sweepOf([bannerSection()]));

    assert.equal(snapshot.subjects[0].description, "Computer & Science");
  });

  test("collects the attribute catalogue", () => {
    const snapshot = assemble(
      sweepOf([
        bannerSection({
          courseReferenceNumber: "50001",
          sectionAttributes: [
            sectionAttribute("50001", "NCND", " Natural/Designed World "),
          ],
        }),
      ]),
    );

    assert.deepEqual(snapshot.attributes, [
      { code: "NCND", name: "Natural/Designed World" },
    ]);
  });

  test("flags honors sections", () => {
    const snapshot = assemble(
      sweepOf([
        bannerSection({
          courseReferenceNumber: "60001",
          sectionAttributes: [sectionAttribute("60001", "HONR", "Honors")],
        }),
      ]),
    );

    assert.equal(snapshot.sections["CS2500"][0].honors, true);
  });
});

describe("assemble / arrangeCourses parity", () => {
  // assemble must agree with arrangeCourses on everything both describe
  const sections = [
    bannerSection({ courseReferenceNumber: "80001", sequenceNumber: "01" }),
    bannerSection({ courseReferenceNumber: "80002", sequenceNumber: "02" }),
    bannerSection({
      courseReferenceNumber: "80003",
      courseNumber: "4950",
      courseTitle: "Special Topics in Compilers",
      meetingsFaculty: [meetingsFaculty("80003")],
    }),
    bannerSection({
      courseReferenceNumber: "80004",
      courseNumber: "4950",
      courseTitle: "Special Topics in Robotics",
      sectionAttributes: [sectionAttribute("80004", "TOPC", "Topics")],
    }),
    bannerSection({
      courseReferenceNumber: "80005",
      courseNumber: "4100",
      crossList: "XP",
      crossListCapacity: 60,
      crossListAvailable: 3,
      meetingsFaculty: [
        meetingsFaculty("80005", {
          meetingType: "FNEX",
          meetingTypeDescription: "Final Exam",
          room: "ROOM",
          startDate: "04/25/2026",
        }),
      ],
    }),
    bannerSection({
      courseReferenceNumber: "80006",
      subject: "DS",
      courseNumber: "4100",
      crossList: "XP",
      crossListCapacity: 60,
      crossListAvailable: 3,
    }),
    bannerSection({
      courseReferenceNumber: "80007",
      courseNumber: "1200",
      creditHourLow: 1,
      creditHourHigh: 4,
      meetingsFaculty: [
        meetingsFaculty("80007", { beginTime: null, endTime: null }),
      ],
    }),
  ];

  const snapshot = assemble(sweepOf(sections));
  const legacy = arrangeCourses(sections);

  test("produces the same courses", () => {
    assert.deepEqual(snapshot.courses, legacy.courses);
  });

  test("produces the same sections", () => {
    assert.deepEqual(snapshot.sections, legacy.sections);
  });

  test("produces the same attribute catalogue", () => {
    assert.deepEqual(
      snapshot.attributes,
      [...legacy.attributes].map(([code, name]) => ({ code, name })),
    );
  });
});
