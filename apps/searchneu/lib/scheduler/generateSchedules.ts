import {
  db,
  coursesT,
  meetingTimesT,
  sectionsT,
  nupathsT,
  courseNupathJoinT,
  subjectsT,
  campusesT,
} from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { SectionWithCourse } from "./filters";
import { meetingTimesToBinaryMask } from "./binaryMeetingTime";
import {
  MAX_RESULTS,
  generateCombinationsOptimized,
  incrementIndex,
} from "./generateCombinations";
export { MAX_RESULTS, generateCombinationsOptimized, incrementIndex };

export const getSectionsAndMeetingTimes = (courseId: number) => {
  // This code is from the catalog page, ideally we want to abstract this in the future
  const sections = db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      campus: campusesT.name,
      honors: sectionsT.honors,
      classType: sectionsT.classType,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      // Course data
      courseId: coursesT.id,
      courseName: coursesT.name,
      courseSubject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      courseNupaths: sql<
        string[]
      >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
      // Meeting time data
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
    })
    .from(sectionsT)
    .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
    .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
    .where(eq(sectionsT.courseId, courseId))
    .groupBy(
      sectionsT.id,
      sectionsT.crn,
      sectionsT.faculty,
      sectionsT.campus,
      campusesT.name,
      sectionsT.honors,
      sectionsT.classType,
      sectionsT.seatRemaining,
      sectionsT.seatCapacity,
      sectionsT.waitlistCapacity,
      sectionsT.waitlistRemaining,
      coursesT.id,
      coursesT.name,
      coursesT.subject,
      subjectsT.code,
      coursesT.courseNumber,
      meetingTimesT.id,
      meetingTimesT.days,
      meetingTimesT.startTime,
      meetingTimesT.endTime,
    )
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
            courseId: row.courseId,
            courseName: row.courseName,
            courseSubject: row.courseSubject,
            courseNumber: row.courseNumber,
            courseNupaths: row.courseNupaths,
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

/**
 * Helper function to try adding optional courses to a base schedule.
 *
 * Key optimisations vs the original:
 * - Optional section masks are pre-computed once by the caller and passed in.
 * - A single combined `bigint` mask is threaded through recursion instead of
 *   an array — conflict check is O(1) rather than O(n).
 * - The mutable `currentSchedule` array uses push/pop instead of spreading a
 *   new array on every recursive call.
 */
const addOptionalCourses = (
  baseSchedule: SectionWithCourse[],
  baseMask: bigint,
  optionalSectionsByCourse: SectionWithCourse[][],
  optionalSectionMasks: bigint[][],
  numCourses?: number,
  maxResults?: number,
): SectionWithCourse[][] => {
  const results: SectionWithCourse[][] = [];
  // Mutated in-place; copied only when pushed to results
  const currentSchedule: SectionWithCourse[] = [...baseSchedule];

  const recurse = (combinedMask: bigint, courseIndex: number) => {
    if (maxResults !== undefined && results.length >= maxResults) return;

    if (courseIndex === optionalSectionsByCourse.length) {
      if (numCourses === undefined || currentSchedule.length === numCourses) {
        results.push([...currentSchedule]);
      }
      return;
    }

    if (numCourses !== undefined) {
      const remainingSlots = optionalSectionsByCourse.length - courseIndex;
      if (currentSchedule.length + remainingSlots < numCourses) return;

      if (currentSchedule.length === numCourses) {
        recurse(combinedMask, optionalSectionsByCourse.length);
        return;
      }
    }

    // Choice A: Skip this optional course
    recurse(combinedMask, courseIndex + 1);

    if (maxResults !== undefined && results.length >= maxResults) return;

    // Choice B: Try each section of this optional course
    const sections = optionalSectionsByCourse[courseIndex];
    const masks = optionalSectionMasks[courseIndex];
    for (let i = 0; i < sections.length; i++) {
      const sectionMask = masks[i];
      if ((combinedMask & sectionMask) === BigInt(0)) {
        currentSchedule.push(sections[i]);
        recurse(combinedMask | sectionMask, courseIndex + 1);
        currentSchedule.pop();
        if (maxResults !== undefined && results.length >= maxResults) return;
      }
    }
  };

  recurse(baseMask, 0);
  return results;
};

// the main generate schedule function
// takes a list of locked course IDs and optional course IDs
// returns a list of valid schedules (each schedule is a list of sections)
export const generateSchedules = async (
  lockedCourseIds: number[],
  optionalCourseIds: number[],
  numCourses?: number,
): Promise<SectionWithCourse[][]> => {
  const lockedSectionsByCourse = await Promise.all(
    lockedCourseIds.map(getSectionsAndMeetingTimes),
  );
  const optionalSectionsByCourse = await Promise.all(
    optionalCourseIds.map(getSectionsAndMeetingTimes),
  );
  optionalSectionsByCourse.sort((a, b) => a.length - b.length);

  // Pre-compute optional section masks once — reused for every locked schedule
  const optionalSectionMasks: bigint[][] = optionalSectionsByCourse.map(
    (sections: SectionWithCourse[]) => sections.map(meetingTimesToBinaryMask),
  );

  const lockedSchedules = generateCombinationsOptimized(lockedSectionsByCourse);

  // Edge case: No locked courses
  if (lockedCourseIds.length === 0 && optionalCourseIds.length > 0) {
    return addOptionalCourses(
      [],
      BigInt(0),
      optionalSectionsByCourse,
      optionalSectionMasks,
      numCourses,
      MAX_RESULTS,
    );
  }

  // If no optional courses, filter the locked schedules by the required count
  if (optionalCourseIds.length === 0) {
    const schedules = lockedSchedules.map((r) => r.schedule);
    return numCourses !== undefined
      ? schedules.filter((s) => s.length === numCourses)
      : schedules;
  }

  const allSchedules: SectionWithCourse[][] = [];
  for (const { schedule, mask } of lockedSchedules) {
    // If a locked schedule is already too big, it can't be valid
    if (numCourses !== undefined && schedule.length > numCourses) continue;

    const remaining = MAX_RESULTS - allSchedules.length;
    const schedulesWithOptional = addOptionalCourses(
      schedule,
      mask,
      optionalSectionsByCourse,
      optionalSectionMasks,
      numCourses,
      remaining,
    );
    for (const s of schedulesWithOptional) allSchedules.push(s);
    if (allSchedules.length >= MAX_RESULTS) break;
  }

  return allSchedules;
};
