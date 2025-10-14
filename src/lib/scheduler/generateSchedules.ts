import { Section } from "@/components/coursePage/SectionTable";
import { db } from "@/db";
import { coursesT, meetingTimesT, sectionsT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SectionWithCourse } from "./filters";

const getSectionsAndMeetingTimes = (courseId: number) => {
  // This code is from the catalog page, ideally we want to abstract this in the future
  const sections = db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      campus: sectionsT.campus,
      honors: sectionsT.honors,
      classType: sectionsT.classType,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      // Course data
      courseName: coursesT.name,
      courseSubject: coursesT.subject,
      courseNumber: coursesT.courseNumber,
      // Meeting time data
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
    })
    .from(sectionsT)
    .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .where(eq(sectionsT.courseId, courseId))
    .then((rows) => {
      // Group the rows by section and reconstruct the meetingTimes array
      const sectionMap = new Map<number, SectionWithCourse>();

      for (const row of rows) {
        if (!sectionMap.has(row.id)) {
          sectionMap.set(row.id, {
            id: row.id,
            crn: row.crn,
            faculty: row.faculty,
            campus: row.campus,
            honors: row.honors,
            classType: row.classType,
            seatRemaining: row.seatRemaining,
            seatCapacity: row.seatCapacity,
            waitlistCapacity: row.waitlistCapacity,
            waitlistRemaining: row.waitlistRemaining,
            courseName: row.courseName,
            courseSubject: row.courseSubject,
            courseNumber: row.courseNumber,
            meetingTimes: [],
          });
        }

        // Add meeting time if it exists
        if (row.meetingTimeId && row.days && row.startTime && row.endTime) {
          const section = sectionMap.get(row.id)!;
          section.meetingTimes.push({
            days: row.days,
            startTime: row.startTime,
            endTime: row.endTime,
            final: false, // You'll need to add this field to meetingTimesT if needed
            finalDate: undefined,
          });
        }
      }

      return Array.from(sectionMap.values());
    });

  return sections;
};

// Helper function to check if two meeting times conflict
const hasTimeConflict = (
  time1: { days: number[]; startTime: number; endTime: number },
  time2: { days: number[]; startTime: number; endTime: number }
): boolean => {
  // Check if they share any days
  const sharedDays = time1.days.filter((day) => time2.days.includes(day));
  if (sharedDays.length === 0) return false;

  // Check if time ranges overlap
  return !(time1.endTime <= time2.startTime || time2.endTime <= time1.startTime);
};

// Helper function to check if two sections have any time conflicts
const sectionsHaveConflict = (section1: SectionWithCourse, section2: SectionWithCourse): boolean => {
  for (const time1 of section1.meetingTimes) {
    for (const time2 of section2.meetingTimes) {
      if (hasTimeConflict(time1, time2)) {
        return true;
      }
    }
  }
  return false;
};

// Helper function to check if a combination of sections has any conflicts
const isValidSchedule = (sections: SectionWithCourse[]): boolean => {
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (sectionsHaveConflict(sections[i], sections[j])) {
        return false;
      }
    }
  }
  return true;
};

// Helper function to generate all combinations of sections
const generateCombinations = (sectionsByCourse: SectionWithCourse[][]): SectionWithCourse[][] => {
  if (sectionsByCourse.length === 0) return [];
  if (sectionsByCourse.length === 1) return sectionsByCourse[0].map((section) => [section]);

  const result: SectionWithCourse[][] = [];

  const generateRecursive = (currentCombination: SectionWithCourse[], courseIndex: number) => {
    if (courseIndex === sectionsByCourse.length) {
      result.push([...currentCombination]);
      return;
    }

    for (const section of sectionsByCourse[courseIndex]) {
      currentCombination.push(section);
      generateRecursive(currentCombination, courseIndex + 1);
      currentCombination.pop();
    }
  };

  generateRecursive([], 0);
  return result;
};

export const generateSchedules = async (
  courseIds: number[]
): Promise<SectionWithCourse[][]> => {
  // assume that all courseIds are from the same term, add logic to check this later
  const sectionsByCourse = await Promise.all(courseIds.map(getSectionsAndMeetingTimes));

  // Generate all possible combinations of sections
  const allCombinations = generateCombinations(sectionsByCourse);

  // Filter to only valid schedules (no time conflicts)
  const validSchedules = allCombinations.filter(isValidSchedule);

  return validSchedules;
};