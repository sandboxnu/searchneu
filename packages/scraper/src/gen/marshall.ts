import { consola } from "consola";
import type { Course, Section } from "../types";
import * as z from "zod";
import { BannerSection } from "../schemas/section";

/* arrangeCourses takes the raw sections scraped from banner and
 *
 * @param bannerSections
 * @returns
 */
export function arrangeCourses(
  bannerSections: z.infer<typeof BannerSection>[],
) {
  const courses: { [key: string]: Course } = {};
  const xlist: { [key: string]: string[] } = {};
  const sections: { [key: string]: Section[] } = {};
  const subjectCodes: string[] = [];
  const attributes: Map<string, string> = new Map();
  const campuses: Map<string, string> = new Map();
  const buildings: Map<string, Map<string, string>> = new Map();

  const crns: string[] = [];

  for (const s of bannerSections) {
    if (!Object.keys(courses).includes(s.subjectCourse)) {
      const specialTopics = s.courseTitle.includes("Special Topics");

      const courseAttributes = s.sectionAttributes.map((a) => ({
        code: a.code,
        description: a.description.trim(),
      }));

      courseAttributes.forEach((n) => attributes.set(n.code, n.description));

      courses[s.subjectCourse] = {
        // special topic courses are when course information is section scoped
        specialTopics: specialTopics,
        // the section title is the course title for non-special topic courses
        name: specialTopics ? "Special Topics" : s.courseTitle,
        courseNumber: s.courseNumber,
        subject: s.subject,
        description: "", // note - this will be filled in later when the descriptions are scraped
        maxCredits: s.creditHourHigh ?? s.creditHourLow,
        minCredits: s.creditHourLow,
        attributes: courseAttributes.map((n) => n.code),
        prereqs: {},
        coreqs: {},
        postreqs: {},
      };
    }

    const c = courses[s.subjectCourse];

    if (
      !c.specialTopics &&
      (s.courseTitle !== c.name || // special topic courses have different names between sections
        s.sectionAttributes.filter((s) => s.code === "TOPC").length > 0) // or sometimes have a "Topics" attribute
    ) {
      c.specialTopics = true;
      c.name = "Special Topics"; // update name placeholder (special topic course names are scraped later)
    }

    if (!Object.keys(sections).includes(s.subjectCourse))
      sections[s.subjectCourse] = [];

    if (s.crossList) {
      if (!Object.keys(xlist).includes(s.crossList)) {
        xlist[s.crossList] = [];
      }
      xlist[s.crossList].push(s.courseReferenceNumber);
    }

    crns.push(s.courseReferenceNumber);

    const {
      meetingTimes,
      campuses: mtCampuses,
      buildings: mtBuildings,
    } = parseMeetingTimes(s);

    sections[s.subjectCourse].push({
      crn: s.courseReferenceNumber,
      name: s.courseTitle,
      sectionNumber: s.sequenceNumber,
      description: "",
      seatCapacity: s.crossListCapacity ?? s.maximumEnrollment,
      seatRemaining: s.crossListAvailable ?? s.seatsAvailable,
      waitlistCapacity: s.waitCapacity,
      waitlistRemaining: s.waitAvailable,
      classType: s.scheduleTypeDescription,
      honors: s.sectionAttributes.some((a) => a.description === "Honors"),
      campus: s.campusDescription,
      meetingTimes: meetingTimes,

      faculty: [],

      prereqs: {},
      coreqs: {},

      xlist: s.crossList ? xlist[s.crossList] : [],
    });

    if (!subjectCodes.includes(s.subject)) subjectCodes.push(s.subject);

    // if (mtCampuses.length === 0 && meetingTimes.length > 0) {
    //   consola.warn("no campuses across meeting times", {
    //     crn: s.courseReferenceNumber,
    //     sectionCampus: s.campusDescription,
    //     mt: mtCampuses,
    //   });
    // }

    if (mtCampuses.length > 0) {
      campuses.set(mtCampuses[0].description, mtCampuses[0].code);
    } else if (!campuses.has(s.campusDescription)) {
      campuses.set(s.campusDescription, "?");
    }

    mtBuildings.forEach((v, k) => {
      if (mtCampuses.length === 0) {
        consola.warn("no campus specified for a set building", {
          crn: s.courseReferenceNumber,
        });
        return;
      }

      const campusCode = mtCampuses[0].code;
      if (!buildings.has(campusCode)) {
        buildings.set(campusCode, new Map());
      }
      const campusMap = buildings.get(campusCode);
      if (campusMap) campusMap.set(k, v);
    });
  }

  consola.box("campuses", campuses);
  consola.box("attributes", attributes);
  consola.box("buildings", buildings);

  return {
    courses: Object.values(courses),
    sections,
    subjects: subjectCodes,
    campuses,
    attributes,
    buildings,
  };
}

/*
 * parseMeetingTimes
 *
 * @param {BannerSection} section The raw scraped section to parse
 * @returns
 */
export function parseMeetingTimes(section: z.infer<typeof BannerSection>) {
  // BUG: somewhere in here lol
  const meetings = [];
  const buildings: Map<string, string> = new Map();
  const campuses: { code: string; description: string }[] = [];

  for (const meetingFaculty of section.meetingsFaculty) {
    const meetingTime = meetingFaculty.meetingTime;

    //
    if (meetingTime.campus && meetingTime.campusDescription) {
      campuses.push({
        code: meetingTime.campus,
        description: meetingTime.campusDescription,
      });
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
    if (!meetingTime.beginTime || !meetingTime.endTime) {
      continue;
    }
    const startTime = parseInt(meetingTime.beginTime, 10);
    const endTime = parseInt(meetingTime.endTime, 10);

    const isFinal =
      meetingTime.meetingTypeDescription === "Final Exam" ||
      meetingTime.meetingType === "FNEX";

    // Only include finalDate if it's a final exam
    let finalDate: string | null = null;
    if (isFinal && meetingTime.startDate) {
      finalDate = meetingTime.startDate;
    }

    let actualRoom: string;
    if (!meetingTime.room || meetingTime.room === "ROOM") {
      actualRoom = "";
    } else {
      actualRoom = meetingTime.room;
    }

    if (meetingTime.building && meetingTime.buildingDescription) {
      buildings.set(meetingTime.building, meetingTime.buildingDescription);
    }

    meetings.push({
      building: meetingTime.building || "",
      room: actualRoom,
      days: days,
      startTime: startTime,
      endTime: endTime,
      final: isFinal,
      finalDate: finalDate,
    });
  }

  return { meetingTimes: meetings, campuses, buildings };
}
