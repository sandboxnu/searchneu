import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BannerSection, BannerSectionResponse } from "./section";

function validMeetingTime() {
  return {
    beginTime: "0935",
    building: "RI",
    buildingDescription: "Richards Hall",
    campus: "BOS",
    campusDescription: "Boston",
    category: "01",
    class: "net.hedtech.banner.student.schedule.SectionSessionMeetingTime",
    courseReferenceNumber: "12345",
    creditHourSession: 4,
    endDate: "04/13/2026",
    endTime: "1015",
    friday: false,
    hoursWeek: 1.33,
    meetingScheduleType: "LEC",
    meetingType: "CLAS",
    meetingTypeDescription: "Class",
    monday: true,
    room: "300",
    saturday: false,
    startDate: "01/12/2026",
    sunday: false,
    term: "202630",
    thursday: false,
    tuesday: false,
    wednesday: true,
  };
}

function validMeetingsFacultyItem() {
  return {
    category: "01",
    class: "net.hedtech.banner.student.schedule.SectionSessionMeetingFaculty",
    courseReferenceNumber: "12345",
    faculty: [
      {
        bannerId: "001234567",
        category: "01",
        class: "net.hedtech.banner.student.schedule.SectionSessionFaculty",
        courseReferenceNumber: "12345",
        displayName: "Smith, John",
        emailAddress: "j.smith@northeastern.edu",
        primaryIndicator: true,
        term: "202630",
      },
    ],
    meetingTime: validMeetingTime(),
    term: "202630",
  };
}

function validSectionAttribute() {
  return {
    class: "net.hedtech.banner.student.schedule.SectionSessionAttribute",
    code: "UBOS",
    courseReferenceNumber: "12345",
    description: "Boston",
    isZTCAttribute: false,
    termCode: "202630",
  };
}

function validSection() {
  return {
    id: 1,
    term: "202630",
    termDesc: "Spring 2026 (View Only)",
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
    enrollment: 95,
    seatsAvailable: 5,
    waitCapacity: 10,
    waitCount: 3,
    waitAvailable: 7,
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
    meetingsFaculty: [validMeetingsFacultyItem()],
    reservedSeatSummary: null,
    sectionAttributes: [validSectionAttribute()],
    instructionalMethod: null,
    instructionalMethodDescription: null,
  };
}

function validSectionResponse() {
  return {
    success: true,
    totalCount: 1,
    data: [validSection()],
    pageOffset: 0,
    pageMaxSize: 500,
    sectionsFetchedCount: 1,
    pathMode: null,
    searchResultsConfigs: [
      {
        config: "config1",
        display: "display1",
        title: "Title",
        required: true,
        width: "100",
      },
    ],
    ztcEncodedImage: "data:image/png;base64,...",
  };
}

describe("BannerSection", () => {
  test("accepts a valid section with all required fields", () => {
    const result = BannerSection.safeParse(validSection());
    assert.ok(result.success);
  });

  test("rejects extra fields (strictObject)", () => {
    const data = { ...validSection(), extra: "field" };
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("validates nested meetingsFaculty array", () => {
    const data = validSection();
    data.meetingsFaculty = [{ invalid: true } as never];
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("validates nested sectionAttributes array", () => {
    const data = validSection();
    data.sectionAttributes = [{ invalid: true } as never];
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("courseNumber must be exactly 4 characters", () => {
    const tooShort = { ...validSection(), courseNumber: "250" };
    assert.ok(!BannerSection.safeParse(tooShort).success);

    const tooLong = { ...validSection(), courseNumber: "25000" };
    assert.ok(!BannerSection.safeParse(tooLong).success);

    const exact = { ...validSection(), courseNumber: "2500" };
    assert.ok(BannerSection.safeParse(exact).success);
  });

  test("courseReferenceNumber must be exactly 5 characters (BannerCRN)", () => {
    const tooShort = { ...validSection(), courseReferenceNumber: "1234" };
    assert.ok(!BannerSection.safeParse(tooShort).success);

    const tooLong = { ...validSection(), courseReferenceNumber: "123456" };
    assert.ok(!BannerSection.safeParse(tooLong).success);

    const exact = { ...validSection(), courseReferenceNumber: "12345" };
    assert.ok(BannerSection.safeParse(exact).success);
  });

  test("term must be exactly 6 characters (BannerTerm)", () => {
    const tooShort = { ...validSection(), term: "20263" };
    assert.ok(!BannerSection.safeParse(tooShort).success);

    const tooLong = { ...validSection(), term: "2026300" };
    assert.ok(!BannerSection.safeParse(tooLong).success);

    const exact = { ...validSection(), term: "202630" };
    assert.ok(BannerSection.safeParse(exact).success);
  });

  test("linkIdentifier must be null", () => {
    const data = { ...validSection(), linkIdentifier: "A" };
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("isSectionLinked must be false", () => {
    const data = { ...validSection(), isSectionLinked: true };
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("faculty must be an empty array (length 0)", () => {
    const data = { ...validSection(), faculty: [null] };
    const result = BannerSection.safeParse(data);
    assert.ok(!result.success);
  });

  test("creditHours is nullable", () => {
    const withNull = { ...validSection(), creditHours: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), creditHours: 4 };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("crossList is nullable", () => {
    const withNull = { ...validSection(), crossList: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), crossList: "XL01" };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("crossListCapacity is nullable", () => {
    const withNull = { ...validSection(), crossListCapacity: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), crossListCapacity: 50 };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("crossListCount is nullable", () => {
    const withNull = { ...validSection(), crossListCount: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), crossListCount: 30 };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("crossListAvailable is nullable", () => {
    const withNull = { ...validSection(), crossListAvailable: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), crossListAvailable: 20 };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("creditHourHigh is nullable", () => {
    const withNull = { ...validSection(), creditHourHigh: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), creditHourHigh: 8 };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("creditHourIndicator is nullable", () => {
    const withNull = { ...validSection(), creditHourIndicator: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = { ...validSection(), creditHourIndicator: "OR" };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("instructionalMethod is nullable", () => {
    const withNull = { ...validSection(), instructionalMethod: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = {
      ...validSection(),
      instructionalMethod: "Traditional",
    };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("instructionalMethodDescription is nullable", () => {
    const withNull = {
      ...validSection(),
      instructionalMethodDescription: null,
    };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = {
      ...validSection(),
      instructionalMethodDescription: "In Person",
    };
    assert.ok(BannerSection.safeParse(withValue).success);
  });

  test("reservedSeatSummary must be null", () => {
    const withNull = { ...validSection(), reservedSeatSummary: null };
    assert.ok(BannerSection.safeParse(withNull).success);

    const withValue = {
      ...validSection(),
      reservedSeatSummary: "something",
    };
    assert.ok(!BannerSection.safeParse(withValue).success);
  });
});

describe("BannerSectionResponse", () => {
  test("accepts a valid response with data array", () => {
    const result = BannerSectionResponse.safeParse(validSectionResponse());
    assert.ok(result.success);
  });

  test("accepts a response with empty data array", () => {
    const data = { ...validSectionResponse(), data: [], totalCount: 0, sectionsFetchedCount: 0 };
    const result = BannerSectionResponse.safeParse(data);
    assert.ok(result.success);
  });

  test("rejects missing required fields", () => {
    const result = BannerSectionResponse.safeParse({
      success: true,
    });
    assert.ok(!result.success);
  });

  test("rejects extra fields (strictObject)", () => {
    const data = { ...validSectionResponse(), extra: "field" };
    const result = BannerSectionResponse.safeParse(data);
    assert.ok(!result.success);
  });

  test("validates searchResultsConfigs entries (strictObject)", () => {
    const data = validSectionResponse();
    data.searchResultsConfigs = [{ config: "c", extra: true } as never];
    const result = BannerSectionResponse.safeParse(data);
    assert.ok(!result.success);
  });
});
