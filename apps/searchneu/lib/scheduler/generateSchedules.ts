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
import { meetingTimesToBinaryMask, masksConflict } from "./binaryMeetingTime";

const getSectionsAndMeetingTimes = (courseId: number) => {
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
 * Used to keep track of indexes of sections and increment them when they conflict w the current schedule
 * Returns true if overflow (we're done), false otherwise
 */
export const incrementIndex = (
  indexes: number[],
  sizes: number[],
  position: number,
): boolean => {
  indexes[position]++;

  // Handle carry/overflow like an odometer
  while (position >= 0 && indexes[position] >= sizes[position]) {
    indexes[position] = 0;
    position--;
    if (position >= 0) {
      indexes[position]++;
    }
  }

  // If position < 0, we've overflowed completely
  return position < 0;
};

/**
 * Optimized iterative generation with conflict-aware skipping.
 * Uses binary time representation for O(1) conflict checking.
 */
const generateCombinationsOptimized = (
  sectionsByCourse: SectionWithCourse[][],
): SectionWithCourse[][] => {
  if (sectionsByCourse.length === 0) return [];
  if (sectionsByCourse.length === 1)
    return sectionsByCourse[0].map((section) => [section]);

  // Sort courses by number of sections (fewest first)
  const sortedIndices = sectionsByCourse
    .map((sections, idx) => ({ sections, idx, count: sections.length }))
    .sort((a, b) => a.count - b.count);

  const sortedSections = sortedIndices.map((item) => item.sections);
  const result: SectionWithCourse[][] = [];
  const sizes = sortedSections.map((s) => s.length);
  const indexes = new Array(sizes.length).fill(0);

  // Pre-compute binary masks for all sections once
  const sectionMasks: bigint[][] = sortedSections.map((sections) =>
    sections.map(meetingTimesToBinaryMask),
  );

  while (true) {
    // Build combination incrementally and check conflicts as we go
    const combination: SectionWithCourse[] = [];
    const combinationMasks: bigint[] = [];
    let conflictIndex = -1;

    // Build combination one course at a time, checking for conflicts
    for (let i = 0; i < indexes.length; i++) {
      const section = sortedSections[i][indexes[i]];
      const mask = sectionMasks[i][indexes[i]];

      // Check if this section conflicts with any already in the combination
      for (let j = 0; j < combinationMasks.length; j++) {
        if (masksConflict(combinationMasks[j], mask)) {
          conflictIndex = i;
          break;
        }
      }

      if (conflictIndex !== -1) {
        // Found conflict at position i, stop building this combination
        break;
      }

      combination.push(section);
      combinationMasks.push(mask);
    }

    if (conflictIndex === -1) {
      // No conflict - we built a complete valid schedule
      result.push(combination);
      // Increment last index normally
      if (incrementIndex(indexes, sizes, sizes.length - 1)) break;
    } else {
      // Conflict found at position conflictIndex
      // Increment that position to skip this branch
      if (incrementIndex(indexes, sizes, conflictIndex)) break;
    }
  }

  return result;
};

/**
 * Helper function to try adding optional courses to a base schedule.
 */
const addOptionalCourses = (
  baseSchedule: SectionWithCourse[],
  optionalSectionsByCourse: SectionWithCourse[][],
  numCourses?: number,
): SectionWithCourse[][] => {
  const results: SectionWithCourse[][] = [];
  const baseMasks = baseSchedule.map(meetingTimesToBinaryMask);

  const generateOptionalCombinations = (
    currentSchedule: SectionWithCourse[],
    currentMasks: bigint[],
    courseIndex: number,
  ) => {
    // Condition: If we hit the end of the available courses
    if (courseIndex === optionalSectionsByCourse.length) {
      // If numCourses is defined, only push if length matches exactly
      // Otherwise, push everything
      if (numCourses === undefined || currentSchedule.length === numCourses) {
        results.push([...currentSchedule]);
      }
      return;
    }

    // Optimization: If it's impossible to reach numCourses even if we took
    // every remaining course, stop this branch
    if (numCourses !== undefined) {
      const remainingSlots = optionalSectionsByCourse.length - courseIndex;
      if (currentSchedule.length + remainingSlots < numCourses) return;

      // Optimization: If we already have enough courses, don't try to add more
      // Just jump to the end of the recursion to validate the current length
      if (currentSchedule.length === numCourses) {
        generateOptionalCombinations(
          currentSchedule,
          currentMasks,
          optionalSectionsByCourse.length,
        );
        return;
      }
    }

    // Choice A: Try not adding this optional course
    generateOptionalCombinations(
      currentSchedule,
      currentMasks,
      courseIndex + 1,
    );

    // Choice B: Try adding each section of this optional course
    for (const section of optionalSectionsByCourse[courseIndex]) {
      const sectionMask = meetingTimesToBinaryMask(section);
      let hasConflict = false;
      for (const mask of currentMasks) {
        if (masksConflict(mask, sectionMask)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        generateOptionalCombinations(
          [...currentSchedule, section],
          [...currentMasks, sectionMask],
          courseIndex + 1,
        );
      }
    }
  };

  generateOptionalCombinations(baseSchedule, baseMasks, 0);
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

  const validLockedSchedules = generateCombinationsOptimized(
    lockedSectionsByCourse,
  );

  // Edge case: No locked courses
  if (lockedCourseIds.length === 0 && optionalCourseIds.length > 0) {
    return addOptionalCourses([], optionalSectionsByCourse, numCourses);
  }

  // If no optional courses, filter the locked schedules by the required count
  if (optionalCourseIds.length === 0) {
    return numCourses !== undefined
      ? validLockedSchedules.filter((s) => s.length === numCourses)
      : validLockedSchedules;
  }

  const allSchedules: SectionWithCourse[][] = [];
  for (const lockedSchedule of validLockedSchedules) {
    // If a locked schedule is already too big, it can't be valid
    if (numCourses !== undefined && lockedSchedule.length > numCourses)
      continue;

    const schedulesWithOptional = addOptionalCourses(
      lockedSchedule,
      optionalSectionsByCourse,
      numCourses, // Pass target down
    );
    allSchedules.push(...schedulesWithOptional);
  }

  return allSchedules;
};
