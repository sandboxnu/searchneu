import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { arrangeCourses, parseMeetingTimes } from "./marshall";
import { ScraperEventEmitter } from "../events";
import type * as z from "zod";
import type { BannerSection } from "../schemas/banner/section";

/**
 * Helper: build a minimal valid BannerSection conforming to the strict Zod schema.
 * Every required field is present; callers override specific fields via `overrides`.
 */
function makeBannerSection(
  overrides: Partial<z.infer<typeof BannerSection>> = {},
): z.infer<typeof BannerSection> {
  return {
    id: 1,
    term: "202610",
    termDesc: "Spring 2026",
    courseReferenceNumber: "12345",
    partOfTerm: "1",
    courseNumber: "2500",
    subject: "CS",
    subjectDescription: "Computer Science",
    sequenceNumber: "01",
    campusDescription: "Boston",
    scheduleTypeDescription: "Lecture",
    courseTitle: "Fundamentals of Computer Science 1",
    creditHours: null,
    maximumEnrollment: 100,
    enrollment: 80,
    seatsAvailable: 20,
    waitCapacity: 10,
    waitCount: 2,
    waitAvailable: 8,
    crossList: null,
    crossListCapacity: null,
    crossListCount: null,
    crossListAvailable: null,
    creditHourHigh: null,
    creditHourLow: 4,
    creditHourIndicator: null,
    openSection: true,
    linkIdentifier: null,
    isSectionLinked: false,
    subjectCourse: "CS2500",
    faculty: [],
    meetingsFaculty: [],
    reservedSeatSummary: null,
    sectionAttributes: [],
    instructionalMethod: null,
    instructionalMethodDescription: null,
    ...overrides,
  };
}

/**
 * Helper: build a single meetingsFaculty entry that conforms to BannerSectionMeetingsFaculty.
 */
function makeMeetingsFaculty(
  meetingTimeOverrides: Record<string, unknown> = {},
) {
  return {
    category: "01",
    class: "net.hedtech.banner.student.schedule.SectionSessionMeetingFaculty",
    courseReferenceNumber: "12345",
    faculty: [],
    meetingTime: {
      beginTime: "0800",
      building: "WV",
      buildingDescription: "West Village H",
      campus: "BOS",
      campusDescription: "Boston",
      category: "01",
      class:
        "net.hedtech.banner.student.schedule.SectionSessionMeetingDecorator",
      courseReferenceNumber: "12345",
      creditHourSession: null,
      endDate: "04/20/2026",
      endTime: "0940",
      friday: false,
      hoursWeek: 2.66,
      meetingScheduleType: "LEC",
      meetingType: "CLAS",
      meetingTypeDescription: "Class",
      monday: true,
      room: "212",
      saturday: false,
      startDate: "01/05/2026",
      sunday: false,
      term: "202610",
      thursday: false,
      tuesday: false,
      wednesday: true,
      ...meetingTimeOverrides,
    },
    term: "202610",
  };
}

describe("parseMeetingTimes", () => {
  test("converts day booleans to array indices (0-6)", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          sunday: true,
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: true,
        }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes.length, 1);
    assert.deepStrictEqual(meetingTimes[0].days, [0, 2, 4, 6]);
  });

  test("parses time strings to integers", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({ beginTime: "0800", endTime: "1430" }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].startTime, 800);
    assert.equal(meetingTimes[0].endTime, 1430);
  });

  test("skips meetings with null beginTime", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({ beginTime: null, endTime: "0940" }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes.length, 0);
  });

  test("skips meetings with null endTime", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({ beginTime: "0800", endTime: null }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes.length, 0);
  });

  test("detects final exam via meetingTypeDescription", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          meetingTypeDescription: "Final Exam",
          meetingType: "CLAS",
          startDate: "04/20/2026",
        }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].final, true);
    assert.equal(meetingTimes[0].finalDate, "04/20/2026");
  });

  test("detects final exam via meetingType FNEX", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          meetingTypeDescription: "Something Else",
          meetingType: "FNEX",
          startDate: "04/22/2026",
        }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].final, true);
    assert.equal(meetingTimes[0].finalDate, "04/22/2026");
  });

  test("sets finalDate to null for non-final meetings", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          meetingTypeDescription: "Class",
          meetingType: "CLAS",
          startDate: "01/05/2026",
        }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].final, false);
    assert.equal(meetingTimes[0].finalDate, null);
  });

  test("normalizes room 'ROOM' to null", () => {
    const section = makeBannerSection({
      meetingsFaculty: [makeMeetingsFaculty({ room: "ROOM" })],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].room, null);
  });

  test("normalizes null room to null", () => {
    const section = makeBannerSection({
      meetingsFaculty: [makeMeetingsFaculty({ room: null })],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].room, null);
  });

  test("passes through actual room value", () => {
    const section = makeBannerSection({
      meetingsFaculty: [makeMeetingsFaculty({ room: "212" })],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes[0].room, "212");
  });

  test("passes through building, buildingDescription, campus, campusDescription", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          building: "WV",
          buildingDescription: "West Village H",
          campus: "BOS",
          campusDescription: "Boston",
        }),
      ],
    });

    const { meetingTimes } = parseMeetingTimes(section);
    const mt = meetingTimes[0];
    assert.equal(mt.building, "WV");
    assert.equal(mt.buildingDescription, "West Village H");
    assert.equal(mt.campus, "BOS");
    assert.equal(mt.campusDescription, "Boston");
  });

  test("returns empty meetingTimes for section with no meetingsFaculty", () => {
    const section = makeBannerSection({ meetingsFaculty: [] });
    const { meetingTimes } = parseMeetingTimes(section);
    assert.equal(meetingTimes.length, 0);
  });
});

describe("arrangeCourses", () => {
  test("creates course stubs from banner sections", () => {
    const section = makeBannerSection({
      subject: "CS",
      courseNumber: "2500",
      courseTitle: "Fundies 1",
      creditHourLow: 4,
      creditHourHigh: null,
      subjectCourse: "CS2500",
      sectionAttributes: [],
    });

    const result = arrangeCourses([section]);
    assert.equal(result.courses.length, 1);

    const course = result.courses[0];
    assert.equal(course.subject, "CS");
    assert.equal(course.courseNumber, "2500");
    assert.equal(course.name, "Fundies 1");
    assert.equal(course.minCredits, 4);
    assert.equal(course.maxCredits, 4);
    assert.equal(course.specialTopics, false);
    assert.equal(course.description, "");
  });

  test("uses creditHourHigh for maxCredits when present", () => {
    const section = makeBannerSection({
      creditHourLow: 1,
      creditHourHigh: 4,
    });

    const result = arrangeCourses([section]);
    assert.equal(result.courses[0].maxCredits, 4);
    assert.equal(result.courses[0].minCredits, 1);
  });

  test("detects special topics via title containing 'Special Topics'", () => {
    const section = makeBannerSection({
      courseTitle: "Special Topics in AI",
      subjectCourse: "CS4991",
      courseNumber: "4991",
    });

    const result = arrangeCourses([section]);
    assert.equal(result.courses[0].specialTopics, true);
    assert.equal(result.courses[0].name, "Special Topics");
  });

  test("detects special topics via TOPC attribute code", () => {
    const section1 = makeBannerSection({
      courseReferenceNumber: "11111",
      courseTitle: "Machine Learning",
      subjectCourse: "CS4991",
      courseNumber: "4991",
      sectionAttributes: [],
    });

    const section2 = makeBannerSection({
      courseReferenceNumber: "22222",
      courseTitle: "Data Mining",
      subjectCourse: "CS4991",
      courseNumber: "4991",
      sectionAttributes: [
        {
          class: "net.hedtech.banner.student.schedule.SectionDecorator",
          code: "TOPC",
          courseReferenceNumber: "22222",
          description: "Topics Course",
          isZTCAttribute: false,
          termCode: "202610",
        },
      ],
    });

    const result = arrangeCourses([section1, section2]);
    assert.equal(result.courses[0].specialTopics, true);
    assert.equal(result.courses[0].name, "Special Topics");
  });

  test("maps sections to their course key (subjectCourse)", () => {
    const sec1 = makeBannerSection({
      courseReferenceNumber: "11111",
      subjectCourse: "CS2500",
      courseNumber: "2500",
      sequenceNumber: "01",
    });
    const sec2 = makeBannerSection({
      courseReferenceNumber: "22222",
      subjectCourse: "CS2500",
      courseNumber: "2500",
      sequenceNumber: "02",
    });
    const sec3 = makeBannerSection({
      courseReferenceNumber: "33333",
      subjectCourse: "CS3500",
      courseNumber: "3500",
      subject: "CS",
      courseTitle: "Object-Oriented Design",
    });

    const result = arrangeCourses([sec1, sec2, sec3]);
    assert.equal(result.sections["CS2500"].length, 2);
    assert.equal(result.sections["CS3500"].length, 1);
  });

  test("tracks crosslist IDs and CRN arrays", () => {
    const sec1 = makeBannerSection({
      courseReferenceNumber: "11111",
      subjectCourse: "CS2500",
      courseNumber: "2500",
      crossList: "XL01",
      crossListCapacity: 200,
      crossListCount: 150,
      crossListAvailable: 50,
    });
    const sec2 = makeBannerSection({
      courseReferenceNumber: "22222",
      subjectCourse: "CS2501",
      courseNumber: "2501",
      courseTitle: "Lab for CS 2500",
      crossList: "XL01",
      crossListCapacity: 200,
      crossListCount: 150,
      crossListAvailable: 50,
    });

    const result = arrangeCourses([sec1, sec2]);

    const cs2500Sec = result.sections["CS2500"][0];
    const cs2501Sec = result.sections["CS2501"][0];

    assert.ok(cs2500Sec.xlist.includes("11111"));
    assert.ok(cs2500Sec.xlist.includes("22222"));
    assert.ok(cs2501Sec.xlist.includes("11111"));
    assert.ok(cs2501Sec.xlist.includes("22222"));
  });

  test("collects unique attributes from sections", () => {
    const section = makeBannerSection({
      sectionAttributes: [
        {
          class: "net.hedtech.banner.student.schedule.SectionDecorator",
          code: "HNRS",
          courseReferenceNumber: "12345",
          description: "Honors ",
          isZTCAttribute: false,
          termCode: "202610",
        },
        {
          class: "net.hedtech.banner.student.schedule.SectionDecorator",
          code: "NUPATH",
          courseReferenceNumber: "12345",
          description: "NUpath ",
          isZTCAttribute: false,
          termCode: "202610",
        },
      ],
    });

    const result = arrangeCourses([section]);

    assert.equal(result.attributes.get("HNRS"), "Honors");
    assert.equal(result.attributes.get("NUPATH"), "NUpath");

    assert.ok(result.courses[0].attributes.includes("HNRS"));
    assert.ok(result.courses[0].attributes.includes("NUPATH"));
  });

  test("uses crossListCapacity/crossListAvailable when crossList is present", () => {
    const section = makeBannerSection({
      crossList: "XL01",
      crossListCapacity: 200,
      crossListCount: 150,
      crossListAvailable: 50,
      maximumEnrollment: 100,
      seatsAvailable: 20,
    });

    const result = arrangeCourses([section]);
    const sec = result.sections["CS2500"][0];
    assert.equal(sec.seatCapacity, 200);
    assert.equal(sec.seatRemaining, 50);
  });

  test("falls back to maximumEnrollment/seatsAvailable when no crossList", () => {
    const section = makeBannerSection({
      crossList: null,
      crossListCapacity: null,
      crossListAvailable: null,
      maximumEnrollment: 100,
      seatsAvailable: 20,
    });

    const result = arrangeCourses([section]);
    const sec = result.sections["CS2500"][0];
    assert.equal(sec.seatCapacity, 100);
    assert.equal(sec.seatRemaining, 20);
  });

  test("multiple sections for the same course", () => {
    const sec1 = makeBannerSection({
      courseReferenceNumber: "11111",
      sequenceNumber: "01",
      courseTitle: "Fundies 1",
      subjectCourse: "CS2500",
    });
    const sec2 = makeBannerSection({
      courseReferenceNumber: "22222",
      sequenceNumber: "02",
      courseTitle: "Fundies 1",
      subjectCourse: "CS2500",
    });

    const result = arrangeCourses([sec1, sec2]);

    assert.equal(result.courses.length, 1);
    assert.equal(result.sections["CS2500"].length, 2);
    assert.equal(result.sections["CS2500"][0].crn, "11111");
    assert.equal(result.sections["CS2500"][1].crn, "22222");
    assert.equal(result.sections["CS2500"][0].sectionNumber, "01");
    assert.equal(result.sections["CS2500"][1].sectionNumber, "02");
  });

  test("empty input returns empty structures", () => {
    const result = arrangeCourses([]);
    assert.equal(result.courses.length, 0);
    assert.deepStrictEqual(result.sections, {});
    assert.equal(result.attributes.size, 0);
  });

  test("emits scrape:courses:stubbed event when emitter is provided", () => {
    const emitter = new ScraperEventEmitter();
    let emitted = false;
    emitter.on("scrape:courses:stubbed", () => {
      emitted = true;
    });

    arrangeCourses([], emitter);
    assert.equal(emitted, true);
  });

  test("section honors flag derived from sectionAttributes", () => {
    const section = makeBannerSection({
      sectionAttributes: [
        {
          class: "net.hedtech.banner.student.schedule.SectionDecorator",
          code: "HNRS",
          courseReferenceNumber: "12345",
          description: "Honors",
          isZTCAttribute: false,
          termCode: "202610",
        },
      ],
    });

    const result = arrangeCourses([section]);
    assert.equal(result.sections["CS2500"][0].honors, true);
  });

  test("section honors flag is false when no Honors attribute", () => {
    const section = makeBannerSection({ sectionAttributes: [] });
    const result = arrangeCourses([section]);
    assert.equal(result.sections["CS2500"][0].honors, false);
  });

  test("section includes parsed meeting times", () => {
    const section = makeBannerSection({
      meetingsFaculty: [
        makeMeetingsFaculty({
          monday: true,
          wednesday: true,
          friday: false,
          beginTime: "1335",
          endTime: "1515",
        }),
      ],
    });

    const result = arrangeCourses([section]);
    const mt = result.sections["CS2500"][0].meetingTimes;
    assert.equal(mt.length, 1);
    assert.deepStrictEqual(mt[0].days, [1, 3]);
    assert.equal(mt[0].startTime, 1335);
    assert.equal(mt[0].endTime, 1515);
  });
});
