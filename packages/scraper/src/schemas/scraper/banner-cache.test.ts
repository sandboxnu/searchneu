import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  ScraperBannerCacheRequisiteTest,
  ScraperBannerCacheRequisiteCourse,
  ScraperBannerCacheRequisiteCondition,
  ScraperBannerCacheRequisiteItem,
  ScraperBannerCacheRequisite,
  ScraperBannerFaculty,
  ScraperBannerMeetingTime,
  ScraperBannerCacheCourse,
  ScraperBannerCacheSection,
  ScraperBannerCache,
} from "./banner-cache.js";

describe("ScraperBannerCacheRequisiteTest", () => {
  test("valid with numeric score", () => {
    const result = ScraperBannerCacheRequisiteTest.safeParse({
      name: "SAT Math",
      score: 600,
    });
    assert.equal(result.success, true);
  });

  test("valid with null score", () => {
    const result = ScraperBannerCacheRequisiteTest.safeParse({
      name: "SAT Math",
      score: null,
    });
    assert.equal(result.success, true);
  });

  test("rejects missing name", () => {
    const result = ScraperBannerCacheRequisiteTest.safeParse({ score: 600 });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerCacheRequisiteTest.safeParse({
      name: "SAT Math",
      score: 600,
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("ScraperBannerCacheRequisiteCourse", () => {
  test("valid course requisite", () => {
    const result = ScraperBannerCacheRequisiteCourse.safeParse({
      subject: "CS",
      courseNumber: "2500",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing subject", () => {
    const result = ScraperBannerCacheRequisiteCourse.safeParse({
      courseNumber: "2500",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerCacheRequisiteCourse.safeParse({
      subject: "CS",
      courseNumber: "2500",
      extra: "nope",
    });
    assert.equal(result.success, false);
  });
});

describe("ScraperBannerCacheRequisiteCondition", () => {
  test("valid 'and' condition with course items", () => {
    const result = ScraperBannerCacheRequisiteCondition.safeParse({
      type: "and",
      items: [
        { subject: "CS", courseNumber: "2500" },
        { subject: "CS", courseNumber: "2510" },
      ],
    });
    assert.equal(result.success, true);
  });

  test("valid 'or' condition with test items", () => {
    const result = ScraperBannerCacheRequisiteCondition.safeParse({
      type: "or",
      items: [
        { name: "SAT Math", score: 600 },
        { name: "ACT Math", score: 26 },
      ],
    });
    assert.equal(result.success, true);
  });

  test("recursive: condition containing conditions", () => {
    const result = ScraperBannerCacheRequisiteCondition.safeParse({
      type: "and",
      items: [
        {
          type: "or",
          items: [
            { subject: "CS", courseNumber: "2500" },
            { subject: "CS", courseNumber: "1800" },
          ],
        },
        {
          type: "or",
          items: [
            { name: "SAT Math", score: 600 },
            { subject: "MATH", courseNumber: "1341" },
          ],
        },
      ],
    });
    assert.equal(result.success, true);
  });

  test("rejects invalid type", () => {
    const result = ScraperBannerCacheRequisiteCondition.safeParse({
      type: "xor",
      items: [],
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerCacheRequisiteCondition.safeParse({
      type: "and",
      items: [],
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("ScraperBannerCacheRequisiteItem", () => {
  test("accepts course", () => {
    const result = ScraperBannerCacheRequisiteItem.safeParse({
      subject: "CS",
      courseNumber: "2500",
    });
    assert.equal(result.success, true);
  });

  test("accepts test", () => {
    const result = ScraperBannerCacheRequisiteItem.safeParse({
      name: "SAT",
      score: null,
    });
    assert.equal(result.success, true);
  });

  test("accepts condition", () => {
    const result = ScraperBannerCacheRequisiteItem.safeParse({
      type: "or",
      items: [{ subject: "CS", courseNumber: "2500" }],
    });
    assert.equal(result.success, true);
  });
});

describe("ScraperBannerCacheRequisite", () => {
  test("accepts empty record", () => {
    const result = ScraperBannerCacheRequisite.safeParse({});
    assert.equal(result.success, true);
  });

  test("accepts a course requisite item", () => {
    const result = ScraperBannerCacheRequisite.safeParse({
      subject: "CS",
      courseNumber: "2500",
    });
    assert.equal(result.success, true);
  });

  test("accepts a condition requisite item", () => {
    const result = ScraperBannerCacheRequisite.safeParse({
      type: "and",
      items: [{ subject: "CS", courseNumber: "2500" }],
    });
    assert.equal(result.success, true);
  });
});

describe("ScraperBannerFaculty", () => {
  test("valid faculty with email", () => {
    const result = ScraperBannerFaculty.safeParse({
      displayName: "John Doe",
      email: "j.doe@northeastern.edu",
      primary: true,
    });
    assert.equal(result.success, true);
  });

  test("valid faculty with null email", () => {
    const result = ScraperBannerFaculty.safeParse({
      displayName: "Jane Doe",
      email: null,
      primary: false,
    });
    assert.equal(result.success, true);
  });

  test("rejects missing primary", () => {
    const result = ScraperBannerFaculty.safeParse({
      displayName: "John Doe",
      email: null,
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerFaculty.safeParse({
      displayName: "John Doe",
      email: null,
      primary: true,
      office: "Room 101",
    });
    assert.equal(result.success, false);
  });
});

describe("ScraperBannerMeetingTime", () => {
  const validMeetingTime = {
    building: "WVH",
    buildingDescription: "West Village H",
    room: "210",
    campus: "BOS",
    campusDescription: "Boston",
    days: [1, 3, 5],
    startTime: 800,
    endTime: 940,
    final: false,
    finalDate: null,
  };

  test("valid meeting time", () => {
    const result = ScraperBannerMeetingTime.safeParse(validMeetingTime);
    assert.equal(result.success, true);
  });

  test("valid with all nullable fields null", () => {
    const result = ScraperBannerMeetingTime.safeParse({
      ...validMeetingTime,
      building: null,
      buildingDescription: null,
      room: null,
      campus: null,
      campusDescription: null,
      finalDate: null,
    });
    assert.equal(result.success, true);
  });

  test("days array max 7 items", () => {
    const result = ScraperBannerMeetingTime.safeParse({
      ...validMeetingTime,
      days: [1, 2, 3, 4, 5, 6, 7, 8],
    });
    assert.equal(result.success, false);
  });

  test("days must contain integers", () => {
    const result = ScraperBannerMeetingTime.safeParse({
      ...validMeetingTime,
      days: [1.5],
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerMeetingTime.safeParse({
      ...validMeetingTime,
      instructor: "John",
    });
    assert.equal(result.success, false);
  });
});

describe("ScraperBannerCacheCourse", () => {
  const validCourse = {
    subject: "CS",
    courseNumber: "2500",
    specialTopics: false,
    name: "Fundamentals of Computer Science 1",
    description: "Intro to CS",
    maxCredits: 4,
    minCredits: 4,
    attributes: ["NUpath Writing"],
    coreqs: {},
    prereqs: {},
    postreqs: {},
  };

  test("valid course parses successfully", () => {
    const result = ScraperBannerCacheCourse.safeParse(validCourse);
    assert.equal(result.success, true);
  });

  test("valid course with optional crn", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      ...validCourse,
      crn: "12345",
    });
    assert.equal(result.success, true);
  });

  test("courseNumber must be 4 chars", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      ...validCourse,
      courseNumber: "250",
    });
    assert.equal(result.success, false);
  });

  test("courseNumber of 5 chars rejects", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      ...validCourse,
      courseNumber: "25000",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing required fields", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      subject: "CS",
      courseNumber: "2500",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      ...validCourse,
      level: "undergraduate",
    });
    assert.equal(result.success, false);
  });

  test("course with requisite items", () => {
    const result = ScraperBannerCacheCourse.safeParse({
      ...validCourse,
      prereqs: {
        type: "and",
        items: [
          { subject: "CS", courseNumber: "1800" },
          { subject: "CS", courseNumber: "1802" },
        ],
      },
    });
    assert.equal(result.success, true);
  });
});

describe("ScraperBannerCacheSection", () => {
  const validSection = {
    crn: "12345",
    name: "Fundamentals of Computer Science 1",
    description: "Intro to CS",
    sectionNumber: "01",
    partOfTerm: "1",
    seatCapacity: 100,
    seatRemaining: 25,
    waitlistCapacity: 10,
    waitlistRemaining: 5,
    classType: "Lecture",
    honors: false,
    campus: "BOS",
    meetingTimes: [
      {
        building: "WVH",
        buildingDescription: "West Village H",
        room: "210",
        campus: "BOS",
        campusDescription: "Boston",
        days: [1, 3, 5],
        startTime: 800,
        endTime: 940,
        final: false,
        finalDate: null,
      },
    ],
    faculty: [
      {
        displayName: "John Doe",
        email: "j.doe@northeastern.edu",
        primary: true,
      },
    ],
    xlist: [],
    coreqs: {},
    prereqs: {},
  };

  test("valid section parses successfully", () => {
    const result = ScraperBannerCacheSection.safeParse(validSection);
    assert.equal(result.success, true);
  });

  test("crn must be 5 chars", () => {
    const result = ScraperBannerCacheSection.safeParse({
      ...validSection,
      crn: "1234",
    });
    assert.equal(result.success, false);
  });

  test("crn of 6 chars rejects", () => {
    const result = ScraperBannerCacheSection.safeParse({
      ...validSection,
      crn: "123456",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = ScraperBannerCacheSection.safeParse({
      ...validSection,
      instructor: "Jane",
    });
    assert.equal(result.success, false);
  });

  test("xlist accepts string array", () => {
    const result = ScraperBannerCacheSection.safeParse({
      ...validSection,
      xlist: ["CS 2500", "DS 2500"],
    });
    assert.equal(result.success, true);
  });
});

describe("ScraperBannerCache", () => {
  const validCache = {
    version: 5,
    timestamp: "2025-01-15T10:30:00Z",
    term: { code: "202510", description: "Fall 2025" },
    courses: [
      {
        subject: "CS",
        courseNumber: "2500",
        specialTopics: false,
        name: "Fundamentals of Computer Science 1",
        description: "Intro to CS",
        maxCredits: 4,
        minCredits: 4,
        attributes: [],
        coreqs: {},
        prereqs: {},
        postreqs: {},
      },
    ],
    sections: {
      "CS2500": [
        {
          crn: "12345",
          name: "Fundamentals of Computer Science 1",
          description: "Intro to CS",
          sectionNumber: "01",
          partOfTerm: "1",
          seatCapacity: 100,
          seatRemaining: 25,
          waitlistCapacity: 10,
          waitlistRemaining: 5,
          classType: "Lecture",
          honors: false,
          campus: "BOS",
          meetingTimes: [],
          faculty: [],
          xlist: [],
          coreqs: {},
          prereqs: {},
        },
      ],
    },
    attributes: [{ code: "NUP-WI", name: "NUpath Writing Intensive" }],
    subjects: [{ code: "CS", description: "Computer Science" }],
    campuses: [{ code: "BOS", description: "Boston" }],
  };

  test("valid full cache object parses successfully", () => {
    const result = ScraperBannerCache.safeParse(validCache);
    assert.equal(result.success, true);
  });

  test("invalid version (not 5) rejects", () => {
    const result = ScraperBannerCache.safeParse({
      ...validCache,
      version: 4,
    });
    assert.equal(result.success, false);
  });

  test("invalid timestamp (not ISO datetime) rejects", () => {
    const result = ScraperBannerCache.safeParse({
      ...validCache,
      timestamp: "not-a-date",
    });
    assert.equal(result.success, false);
  });

  test("rejects non-ISO timestamp format", () => {
    const result = ScraperBannerCache.safeParse({
      ...validCache,
      timestamp: "01/15/2025 10:30:00",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields at top level (strictObject)", () => {
    const result = ScraperBannerCache.safeParse({
      ...validCache,
      extra: "field",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing courses field", () => {
    const { courses: _, ...incomplete } = validCache;
    const result = ScraperBannerCache.safeParse(incomplete);
    assert.equal(result.success, false);
  });

  test("rejects missing term field", () => {
    const { term: _, ...incomplete } = validCache;
    const result = ScraperBannerCache.safeParse(incomplete);
    assert.equal(result.success, false);
  });
});
