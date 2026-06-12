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
import { buildCoreqGroups } from "./coreqResolver";

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
 * Helper function to try adding optional course groups to a base schedule.
 * Each group is treated as a single unit - either all courses in the group are added, or none.
 */
const addOptionalCourseGroups = (
  baseSchedule: SectionWithCourse[],
  optionalGroupsByCourse: Map<number, SectionWithCourse[]>,
  coreqGroups: number[][],
  numCourses?: number,
): SectionWithCourse[][] => {
  const results: SectionWithCourse[][] = [];
  const baseMasks = baseSchedule.map(meetingTimesToBinaryMask);

  // Map courseIds to which group index they belong to
  const groupIndexByCourseId = new Map<number, number>();
  for (let i = 0; i < coreqGroups.length; i++) {
    for (const courseId of coreqGroups[i]) {
      groupIndexByCourseId.set(courseId, i);
    }
  }

  // Get optional group indices in order
  const optionalGroupIndices = Array.from(
    new Set(
      Array.from(optionalGroupsByCourse.keys()).map((cid) =>
        groupIndexByCourseId.get(cid),
      ),
    ),
  )
    .filter((id): id is number => id !== undefined)
    .sort((a, b) => a - b);

  // Helper to count how many groups are in a schedule
  const countGroupsInSchedule = (schedule: SectionWithCourse[]): number => {
    const groupsPresent = new Set<number>();
    for (const section of schedule) {
      const groupIdx = groupIndexByCourseId.get(section.courseId);
      if (groupIdx !== undefined && optionalGroupIndices.includes(groupIdx)) {
        groupsPresent.add(groupIdx);
      }
    }
    return groupsPresent.size;
  };

  const generateOptionalCombinations = (
    currentSchedule: SectionWithCourse[],
    currentMasks: bigint[],
    groupIndex: number,
  ) => {
    // Condition: If we hit the end of the available groups
    if (groupIndex === optionalGroupIndices.length) {
      const groupCount = countGroupsInSchedule(currentSchedule);
      if (numCourses === undefined || groupCount === numCourses) {
        results.push([...currentSchedule]);
      }
      return;
    }

    // Optimization: If it's impossible to reach numCourses even if we took every remaining group
    if (numCourses !== undefined) {
      const groupCount = countGroupsInSchedule(currentSchedule);
      const remainingGroups = optionalGroupIndices.length - groupIndex;
      if (groupCount + remainingGroups < numCourses) return;

      // Optimization: If we already have enough groups, jump to validation
      if (groupCount === numCourses) {
        generateOptionalCombinations(
          currentSchedule,
          currentMasks,
          optionalGroupIndices.length,
        );
        return;
      }
    }

    const currentGroupIdx = optionalGroupIndices[groupIndex];
    const coursesInGroup = coreqGroups[currentGroupIdx];

    // Choice A: Try not adding this optional group
    generateOptionalCombinations(currentSchedule, currentMasks, groupIndex + 1);

    // Choice B: Try adding all sections of all courses in this group (must all fit together)
    const groupSectionsBysCourse = coursesInGroup.map(
      (courseId) => optionalGroupsByCourse.get(courseId) || [],
    );

    // Generate combinations for this group
    const groupCombinations = generateCombinationsOptimized(
      groupSectionsBysCourse,
    );

    for (const groupCombination of groupCombinations) {
      let hasConflict = false;

      // Check if any section in the group conflicts with current schedule
      for (const section of groupCombination) {
        const sectionMask = meetingTimesToBinaryMask(section);
        for (const mask of currentMasks) {
          if (masksConflict(mask, sectionMask)) {
            hasConflict = true;
            break;
          }
        }
        if (hasConflict) break;
      }

      if (!hasConflict) {
        const newMasks = groupCombination.map(meetingTimesToBinaryMask);
        generateOptionalCombinations(
          [...currentSchedule, ...groupCombination],
          [...currentMasks, ...newMasks],
          groupIndex + 1,
        );
      }
    }
  };

  generateOptionalCombinations(baseSchedule, baseMasks, 0);
  return results;
};

/**
 * Main schedule generator.
 *
 * - Corequisite courses are automatically grouped together
 * - If one course in a group is selected, all must be selected
 * - Each group counts as 1 towards numCourses
 * - Locked courses must all be present; optional courses can be any subset
 */
export const generateSchedules = async (
  lockedCourseIds: number[],
  optionalCourseIds: number[],
  numCourses?: number,
): Promise<SectionWithCourse[][]> => {
  // Build coreq groups from all courses
  const allCourseIds = [...lockedCourseIds, ...optionalCourseIds];
  const coreqGroups = await buildCoreqGroups(allCourseIds);

  // Fetch sections for all courses
  const [lockedSectionsByCourse, optionalSectionsByCourse] = await Promise.all([
    Promise.all(lockedCourseIds.map(getSectionsAndMeetingTimes)),
    Promise.all(optionalCourseIds.map(getSectionsAndMeetingTimes)),
  ]);

  // Create Maps for easier lookup by courseId
  const lockedGroupsByCourse = new Map<number, SectionWithCourse[]>();
  lockedCourseIds.forEach((courseId, idx) => {
    lockedGroupsByCourse.set(courseId, lockedSectionsByCourse[idx]);
  });

  const optionalGroupsByCourse = new Map<number, SectionWithCourse[]>();
  optionalCourseIds.forEach((courseId, idx) => {
    optionalGroupsByCourse.set(courseId, optionalSectionsByCourse[idx]);
  });

  // For locked courses: they must all be present, so organize by group
  const lockedGroupsToUse: SectionWithCourse[][] = [];
  for (const group of coreqGroups) {
    const lockedCoursesInGroup = group.filter((cid) =>
      lockedGroupsByCourse.has(cid),
    );
    if (lockedCoursesInGroup.length > 0) {
      // All locked courses in this group must be satisfied
      lockedGroupsToUse.push(
        ...lockedCoursesInGroup.map((cid) => lockedGroupsByCourse.get(cid)!),
      );
    }
  }

  const validLockedSchedules = generateCombinationsOptimized(lockedGroupsToUse);

  // Edge case: No locked courses
  if (lockedCourseIds.length === 0 && optionalCourseIds.length > 0) {
    return addOptionalCourseGroups(
      [],
      optionalGroupsByCourse,
      coreqGroups,
      numCourses,
    );
  }

  // If no optional courses, filter by group count
  if (optionalCourseIds.length === 0) {
    if (numCourses === undefined) {
      return validLockedSchedules;
    }
    // Count groups in each schedule
    return validLockedSchedules.filter((schedule) => {
      const groupCount = new Set(
        schedule.map((s) => {
          for (const group of coreqGroups) {
            if (group.includes(s.courseId)) return coreqGroups.indexOf(group);
          }
          return -1;
        }),
      ).size;
      return groupCount === numCourses;
    });
  }

  const allSchedules: SectionWithCourse[][] = [];
  for (const lockedSchedule of validLockedSchedules) {
    // Count locked groups
    const lockedGroupCount = new Set(
      lockedSchedule.map((s) => {
        for (const group of coreqGroups) {
          if (group.includes(s.courseId)) return coreqGroups.indexOf(group);
        }
        return -1;
      }),
    ).size;

    // If already too many groups, skip
    if (numCourses !== undefined && lockedGroupCount > numCourses) continue;

    const schedulesWithOptional = addOptionalCourseGroups(
      lockedSchedule,
      optionalGroupsByCourse,
      coreqGroups,
      numCourses ? numCourses - lockedGroupCount : undefined,
    );
    allSchedules.push(...schedulesWithOptional);
  }

  return allSchedules;
};
