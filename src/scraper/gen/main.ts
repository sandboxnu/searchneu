import { logger } from "@/lib/logger";
import { scrapeSections } from "./sections";
import type { BannerSection, Course, Section } from "../types";
import { scrapeCourseDescriptions, scrapeCourseNames } from "./courses";
import { sectionFacultyEndpoint } from "./endpoints";
import { decode } from "he";

export async function scrapeCatalogTerm(term: string) {
  // get sections
  logger.info("scraping sections");
  const rawSections = await scrapeSections(term);

  // stub courses from sections
  logger.info("stubbing courses");
  const { courses, sections, subjects, campuses } = arrangeCourses(rawSections);
  const sectionList = Object.values(sections).flat();

  const taggedCourses = courses.map((c) => ({
    course: c,
    crn: sections[c.subject + c.courseNumber][0].crn,
  }));

  // scrape faculty
  const facultyPromises = sectionList
    .map((s) => async () => {
      const url = sectionFacultyEndpoint(term, s.crn);
      const { data, success } = await fe.fetch(url, {}).then((r) => r.json());

      if (!success || !data?.fmt?.length || !data.fmt[0]?.faculty?.length) {
        s.faculty = "TBA";
        return;
      }

      s.faculty =
        decode(decode(data.fmt[0].faculty[0].displayName ?? "TBA")) ?? "TBA";
    })
    .map((p) => p());

  // structure rooms out
  //
  // get term info
  //
  // get subjects
  // get nupaths
  // get campuses
}

/* arrangeCourses takes the raw sections scraped from banner and
 * pulls out the courses, arranging the sections in those courses,
 * pulls out the right fields, etc.
 *
 * @param {BannerSection[]} bannerSections
 * @returns
 */
export function arrangeCourses(bannerSections: BannerSection[]) {
  const courses: { [key: string]: Course } = {};
  const sections: { [key: string]: Section[] } = {};
  const subjects: string[] = [];
  const campuses: string[] = [];

  for (const s of bannerSections) {
    if (!Object.keys(courses).includes(s.subjectCourse)) {
      courses[s.subjectCourse] = {
        name: "", // note - this will be filled in later when the names are scraped
        term: s.term,
        courseNumber: s.courseNumber,
        subject: s.subject,
        description: "", // note - this will be filled in later when the descriptions are scraped
        maxCredits: s.creditHourHigh ?? s.creditHourLow,
        minCredits: s.creditHourLow,
        // Store raw nupath codes from banner - will be filtered during upload
        nupath: s.sectionAttributes
          .filter((a) => a.code.startsWith("NC"))
          .map((a) => a.code.replace("NC", "")),
        prereqs: {},
        coreqs: {},
        postreqs: {},
      };
    }

    if (!Object.keys(sections).includes(s.subjectCourse))
      sections[s.subjectCourse] = [];

    sections[s.subjectCourse].push({
      crn: s.courseReferenceNumber,
      seatCapacity: s.maximumEnrollment,
      seatRemaining: s.seatsAvailable,
      waitlistCapacity: s.waitCapacity,
      waitlistRemaining: s.waitAvailable,
      classType: s.scheduleTypeDescription,
      honors: s.sectionAttributes.some((a) => a.description === "Honors"),
      // Store raw campus code from banner - will be validated during upload
      campus: s.campusDescription,
      meetingTimes: parseMeetingTimes(s),

      faculty: "TBA",
    });

    if (!subjects.includes(s.subject)) subjects.push(s.subject);
    if (!campuses.includes(s.campusDescription))
      campuses.push(s.campusDescription);
  }

  return { courses: Object.values(courses), sections, subjects, campuses };
}

/*
 * parseMeetingTimes
 *
 * @param {BannerSection} section The raw scraped section to parse
 * @returns
 */
export function parseMeetingTimes(section: BannerSection) {
  const meetings = [];
  for (const meetingFaculty of section.meetingsFaculty) {
    const meetingTime = meetingFaculty?.meetingTime;
    if (!meetingTime) {
      logger.info("no meeting time " + section.courseReferenceNumber);
      continue;
    }

    const days = [];
    if (meetingTime.sunday) days.push(0);
    if (meetingTime.monday) days.push(1);
    if (meetingTime.tuesday) days.push(2);
    if (meetingTime.wednesday) days.push(3);
    if (meetingTime.thursday) days.push(4);
    if (meetingTime.friday) days.push(5);
    if (meetingTime.saturday) days.push(6);

    // Convert time strings to integers without timezone adjustment
    // e.g., "0800" -> 800, "1430" -> 1430
    const startTime = parseInt(meetingTime.beginTime, 10);
    const endTime = parseInt(meetingTime.endTime, 10);

    const isFinal =
      meetingTime.meetingTypeDescription === "Final Exam" ||
      meetingTime.meetingType === "FNEX";

    // Only include finalDate if it's a final exam
    let finalDate = null;
    if (isFinal && meetingTime.startDate) {
      finalDate = meetingTime.startDate;
    }

    let actualRoom;
    if (!meetingTime.room) {
      actualRoom = "";
    } else {
      actualRoom = meetingTime.room == "ROOM" ? "" : meetingTime.room;
    }

    meetings.push({
      building: meetingTime.buildingDescription || meetingTime.building || "",
      room: actualRoom,
      days: days,
      startTime: startTime,
      endTime: endTime,
      final: isFinal,
      finalDate: finalDate,
    });
  }

  return meetings;
}
