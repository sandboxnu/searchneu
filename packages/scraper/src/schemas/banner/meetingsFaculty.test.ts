import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BannerSectionMeetingsFaculty,
  BannerSectionMeetingsFacultyResponse,
} from "./meetingsFaculty";

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

function validFacultyItem() {
  return {
    bannerId: "001234567",
    category: "01",
    class: "net.hedtech.banner.student.schedule.SectionSessionFaculty",
    courseReferenceNumber: "12345",
    displayName: "Smith, John",
    emailAddress: "j.smith@northeastern.edu",
    primaryIndicator: true,
    term: "202630",
  };
}

function validMeetingsFaculty() {
  return {
    category: "01",
    class: "net.hedtech.banner.student.schedule.SectionSessionMeetingFaculty",
    courseReferenceNumber: "12345",
    faculty: [validFacultyItem()],
    meetingTime: validMeetingTime(),
    term: "202630",
  };
}

describe("BannerSectionMeetingsFaculty", () => {
  test("accepts a valid object with faculty and meetingTime", () => {
    const result = BannerSectionMeetingsFaculty.safeParse(
      validMeetingsFaculty(),
    );
    assert.ok(result.success);
  });

  test("accepts an empty faculty array", () => {
    const data = validMeetingsFaculty();
    data.faculty = [];
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("accepts nullable emailAddress in faculty", () => {
    const data = validMeetingsFaculty();
    data.faculty = [{ ...validFacultyItem(), emailAddress: null }];
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("accepts nullable beginTime and endTime", () => {
    const data = validMeetingsFaculty();
    data.meetingTime = {
      ...validMeetingTime(),
      beginTime: null,
      endTime: null,
    };
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("accepts nullable building and room", () => {
    const data = validMeetingsFaculty();
    data.meetingTime = {
      ...validMeetingTime(),
      building: null,
      buildingDescription: null,
      room: null,
    };
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("accepts nullable campus fields", () => {
    const data = validMeetingsFaculty();
    data.meetingTime = {
      ...validMeetingTime(),
      campus: null,
      campusDescription: null,
    };
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("accepts nullable creditHourSession", () => {
    const data = validMeetingsFaculty();
    data.meetingTime = { ...validMeetingTime(), creditHourSession: null };
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(result.success);
  });

  test("rejects invalid courseReferenceNumber (wrong length)", () => {
    const data = validMeetingsFaculty();
    data.courseReferenceNumber = "123";
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });

  test("rejects invalid term (wrong length)", () => {
    const data = validMeetingsFaculty();
    data.term = "20";
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });

  test("rejects extra fields on the top-level object (strictObject)", () => {
    const data = { ...validMeetingsFaculty(), extra: "field" };
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });

  test("rejects extra fields on meetingTime (strictObject)", () => {
    const data = validMeetingsFaculty();
    (data.meetingTime as Record<string, unknown>).extra = "field";
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });

  test("rejects extra fields on faculty item (strictObject)", () => {
    const data = validMeetingsFaculty();
    data.faculty = [{ ...validFacultyItem(), extra: "field" } as never];
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });

  test("validates all day-of-week booleans in meetingTime", () => {
    const data = validMeetingsFaculty();
    (data.meetingTime as Record<string, unknown>).monday = "yes";
    const result = BannerSectionMeetingsFaculty.safeParse(data);
    assert.ok(!result.success);
  });
});

describe("BannerSectionMeetingsFacultyResponse", () => {
  test("accepts a valid response with fmt array", () => {
    const result = BannerSectionMeetingsFacultyResponse.safeParse({
      fmt: [validMeetingsFaculty()],
    });
    assert.ok(result.success);
  });

  test("accepts a response with empty fmt array", () => {
    const result = BannerSectionMeetingsFacultyResponse.safeParse({
      fmt: [],
    });
    assert.ok(result.success);
  });

  test("rejects missing fmt field", () => {
    const result = BannerSectionMeetingsFacultyResponse.safeParse({});
    assert.ok(!result.success);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = BannerSectionMeetingsFacultyResponse.safeParse({
      fmt: [],
      extra: "field",
    });
    assert.ok(!result.success);
  });
});
