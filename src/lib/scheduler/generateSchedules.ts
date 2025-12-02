import { db } from "@/db";
import {
  coursesT,
  meetingTimesT,
  sectionsT,
  nupathsT,
  courseNupathJoinT,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SectionWithCourse } from "./filters";

// Limits and defaults
const MAX_COURSES = 8;
const MAX_COMBINATIONS = 500_000; // 500k
const MAX_SECTIONS_PER_COURSE = 50;
const TIMEOUT_MS = 30_000; // 30 seconds

// Calculate an upper bound on total combinations.
// Locked courses contribute `count` each. Optional courses can be omitted,
// so they contribute `(count + 1)` each. Total combos = lockedProduct * optionalFactor
const calculateTotalCombinations = (
  lockedSections: SectionWithCourse[][],
  optionalSections: SectionWithCourse[][],
): number => {
  const lockedProduct = lockedSections.reduce(
    (p, arr) => p * Math.max(arr.length, 0),
    1,
  );

  const optionalFactor = optionalSections.reduce(
    (p, arr) => p * (arr.length + 1),
    1,
  );

  return lockedProduct * optionalFactor;
};

// Wrap a promise with a timeout. If the promise doesn't settle within `ms`, rejects.
const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Schedule generation timed out after ${ms / 1000}s`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

// Validate bounds and throw descriptive errors when limits are exceeded
const validateBounds = (
  lockedCourseIds: number[],
  optionalCourseIds: number[],
  lockedSectionsByCourse: SectionWithCourse[][],
  optionalSectionsByCourse: SectionWithCourse[][],
) => {
  const totalCourses = lockedCourseIds.length + optionalCourseIds.length;
  if (totalCourses > MAX_COURSES) {
    throw new Error(
      `Too many courses requested (${totalCourses}). Maximum allowed is ${MAX_COURSES}. Try generating fewer courses at once.`,
    );
  }

  // Per-course empty detection and per-course section limits
  const emptyCourses: string[] = [];
  const oversizedCourses: string[] = [];

  const inspectCourse = (
    courseId: number,
    sections: SectionWithCourse[],
  ) => {
    const meta = sections[0];
    const label = meta
      ? `${meta.courseSubject} ${meta.courseNumber}`
      : `CourseId ${courseId}`;

    if (sections.length === 0) emptyCourses.push(label);
    if (sections.length > MAX_SECTIONS_PER_COURSE)
      oversizedCourses.push(`${label} (${sections.length})`);
  };

  lockedCourseIds.forEach((id, i) =>
    inspectCourse(id, lockedSectionsByCourse[i] || []),
  );
  optionalCourseIds.forEach((id, i) =>
    inspectCourse(id, optionalSectionsByCourse[i] || []),
  );

  if (emptyCourses.length > 0) {
    throw new Error(
      `One or more courses have no available sections: ${emptyCourses.join(
        ", ",
      )}. Try removing that course or widening filters (time/campus/professor).`,
    );
  }

  if (oversizedCourses.length > 0) {
    throw new Error(
      `One or more courses have an unusually large number of sections: ${oversizedCourses.join(
        ", ",
      )}. Maximum allowed per course is ${MAX_SECTIONS_PER_COURSE}.`,
    );
  }

  const totalCombos = calculateTotalCombinations(
    lockedSectionsByCourse,
    optionalSectionsByCourse,
  );

  if (totalCombos > MAX_COMBINATIONS) {
    // Build a helpful breakdown
    const breakdown: string[] = [];
    lockedSectionsByCourse.forEach((arr, i) => {
      const meta = arr[0];
      const label = meta ? `${meta.courseSubject} ${meta.courseNumber}` : `Locked#${i}`;
      breakdown.push(`${label}: ${arr.length}`);
    });
    optionalSectionsByCourse.forEach((arr, i) => {
      const meta = arr[0];
      const label = meta ? `${meta.courseSubject} ${meta.courseNumber}` : `Optional#${i}`;
      breakdown.push(`${label}: ${arr.length}`);
    });

    throw new Error(
      `Schedule generation would check ~${totalCombos.toLocaleString()} combinations which exceeds the limit of ${MAX_COMBINATIONS.toLocaleString()} (~5s). Course breakdown: ${breakdown.join(
        "; ",
      )}. Try narrowing filters, removing some courses, or generating fewer courses at once.`,
    );
  }
};
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
  // Validate bounds early (throws descriptive errors)
  validateBounds(
    lockedCourseIds,
    optionalCourseIds,
    lockedSectionsByCourse,
    optionalSectionsByCourse,
  );

  // Smart ordering: sort course lists by ascending section count to reduce branching
  const sortedLockedSections = [...lockedSectionsByCourse].sort(
    (a, b) => a.length - b.length,
  );
  const sortedOptionalSections = [...optionalSectionsByCourse].sort(
    (a, b) => a.length - b.length,
  );

  // Do the heavy generation inside a function so we can apply a timeout wrapper.
  const runGeneration = async () => {
    // Edge case: no locked courses but have optional courses
    if (lockedCourseIds.length === 0 && optionalCourseIds.length > 0) {
      const schedulesWithOptional = addOptionalCourses([], sortedOptionalSections);
      return schedulesWithOptional.filter((s) => s.length > 0);
    }

    // Generate and filter locked combinations
    const lockedCombinations = generateCombinations(sortedLockedSections);
    const validLockedSchedules = lockedCombinations.filter(isValidSchedule);

    // If no optional courses, return locked schedules
    if (optionalCourseIds.length === 0) {
      return validLockedSchedules;
    }

    const allSchedules: SectionWithCourse[][] = [];
    for (const lockedSchedule of validLockedSchedules) {
      const schedulesWithOptional = addOptionalCourses(
        lockedSchedule,
        sortedOptionalSections,
      );
      allSchedules.push(...schedulesWithOptional);
    }

    return allSchedules;
  };

  // Run generation with timeout protection
  return await withTimeout(runGeneration(), TIMEOUT_MS);
};
