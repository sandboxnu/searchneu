import { db } from "@/db";
import {
  coursesT,
  meetingTimesT,
  sectionsT,
  nupathsT,
  courseNupathJoinT,
  roomsT,
  buildingsT,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SectionWithCourse } from "./filters";
import { SectionTableRoom } from "@/components/catalog/SectionTable";


const getSectionsAndMeetingTimes = (courseId: number) => {
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
      courseNupaths: sql<
        string[]
      >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
      // Meeting time data
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
      // Room data
      roomId: roomsT.id,
      roomNumber: roomsT.number,
      // Building data
      buildingId: buildingsT.id,
      buildingName: buildingsT.name,
    })
    .from(sectionsT)
    .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .leftJoin(roomsT, eq(meetingTimesT.roomId, roomsT.id))
    .leftJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
    .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
    .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
    .where(eq(sectionsT.courseId, courseId))
    .groupBy(
      sectionsT.id,
      sectionsT.crn,
      sectionsT.faculty,
      sectionsT.campus,
      sectionsT.honors,
      sectionsT.classType,
      sectionsT.seatRemaining,
      sectionsT.seatCapacity,
      sectionsT.waitlistCapacity,
      sectionsT.waitlistRemaining,
      coursesT.name,
      coursesT.subject,
      coursesT.courseNumber,
      meetingTimesT.id,
      meetingTimesT.days,
      meetingTimesT.startTime,
      meetingTimesT.endTime,
      roomsT.id,
      roomsT.number,
      buildingsT.id,
      buildingsT.name,
    )
    .then((rows) => {
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
            courseNupaths: row.courseNupaths,
            meetingTimes: [],
          });
        }

        if (row.meetingTimeId && row.days && row.startTime && row.endTime) {
          const section = sectionMap.get(row.id)!;

          const room: SectionTableRoom | undefined =
            row.roomId && row.roomNumber
              ? {
                id: row.roomId,
                number: row.roomNumber,
                building:
                  row.buildingId && row.buildingName
                    ? { id: row.buildingId, name: row.buildingName }
                    : undefined,
              }
              : undefined;

          section.meetingTimes.push({
            days: row.days,
            startTime: row.startTime,
            endTime: row.endTime,
            final: false,
            room,
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
  time2: { days: number[]; startTime: number; endTime: number },
): boolean => {
  // Check if they share any days
  const sharedDays = time1.days.filter((day) => time2.days.includes(day));
  if (sharedDays.length === 0) return false;

  // Check if time ranges overlap
  return !(
    time1.endTime <= time2.startTime || time2.endTime <= time1.startTime
  );
};

// Helper function to check if two sections have any time conflicts
const sectionsHaveConflict = (
  section1: SectionWithCourse,
  section2: SectionWithCourse,
): boolean => {
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
const generateCombinations = (
  sectionsByCourse: SectionWithCourse[][],
): SectionWithCourse[][] => {
  if (sectionsByCourse.length === 0) return [];
  if (sectionsByCourse.length === 1)
    return sectionsByCourse[0].map((section) => [section]);

  const result: SectionWithCourse[][] = [];

  const generateRecursive = (
    currentCombination: SectionWithCourse[],
    courseIndex: number,
  ) => {
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

// Helper function to try adding optional courses to a base schedule
const addOptionalCourses = (
  baseSchedule: SectionWithCourse[],
  optionalSectionsByCourse: SectionWithCourse[][]
): SectionWithCourse[][] => {
  const results: SectionWithCourse[][] = [];

  // Generate all possible subsets of optional courses (including empty set)
  const generateOptionalCombinations = (
    currentSchedule: SectionWithCourse[],
    courseIndex: number
  ) => {
    // Always add the current schedule (even if no more optional courses are added)
    if (courseIndex === optionalSectionsByCourse.length) {
      results.push([...currentSchedule]);
      return;
    }

    // Try not adding this optional course
    generateOptionalCombinations(currentSchedule, courseIndex + 1);

    // Try adding each section of this optional course if it doesn't conflict
    for (const section of optionalSectionsByCourse[courseIndex]) {
      const testSchedule = [...currentSchedule, section];
      if (isValidSchedule(testSchedule)) {
        generateOptionalCombinations(testSchedule, courseIndex + 1);
      }
    }
  };

  generateOptionalCombinations(baseSchedule, 0);
  return results;
};

export const generateSchedules = async (
  lockedCourseIds: number[],
  optionalCourseIds: number[]
): Promise<SectionWithCourse[][]> => {
  // assume that all courseIds are from the same term, add logic to check this later

  // Remove duplicates from both lists
  lockedCourseIds = Array.from(new Set(lockedCourseIds));
  optionalCourseIds = Array.from(new Set(optionalCourseIds));

  // Remove any IDs from optional that appear in locked (locked takes precedence)
  const lockedSet = new Set(lockedCourseIds);
  optionalCourseIds = optionalCourseIds.filter(id => !lockedSet.has(id));

  // Get sections for locked and optional courses
  const lockedSectionsByCourse = await Promise.all(
    lockedCourseIds.map(getSectionsAndMeetingTimes)
  );
  const optionalSectionsByCourse = await Promise.all(
    optionalCourseIds.map(getSectionsAndMeetingTimes)
  );

  // Generate all possible combinations of locked courses
  const lockedCombinations = generateCombinations(lockedSectionsByCourse);

  // Filter to only valid locked schedules (no time conflicts)
  const validLockedSchedules = lockedCombinations.filter(isValidSchedule);

  // Edge case: no locked courses but have optional courses
  if (lockedCourseIds.length === 0 && optionalCourseIds.length > 0) {
    // Start with empty schedule and add optional courses
    const schedulesWithOptional = addOptionalCourses([], optionalSectionsByCourse);
    // Remove any empty schedules
    return schedulesWithOptional.filter(schedule => schedule.length > 0);
  }

  // If no optional courses, return the locked schedules
  if (optionalCourseIds.length === 0) {
    return validLockedSchedules;
  }

  // For each valid locked schedule, try adding optional courses
  const allSchedules: SectionWithCourse[][] = [];
  for (const lockedSchedule of validLockedSchedules) {
    const schedulesWithOptional = addOptionalCourses(lockedSchedule, optionalSectionsByCourse);
    allSchedules.push(...schedulesWithOptional);
  }

  return allSchedules;
};
