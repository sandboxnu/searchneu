import { Section } from "@/components/coursePage/SectionTable";

export type SectionWithCourse = Section & {
  courseName: string;
  courseSubject: string;
  courseNumber: string;
  courseNupaths?: string[];
};

export type ScheduleFilters = {
  startTime?: number; // in military time format (e.g., 900 for 9:00 AM, 1330 for 1:30 PM)
  endTime?: number; // in military time format (e.g., 900 for 9:00 AM, 1330 for 1:30 PM)
  specificDaysFree?: number[]; // array of day numbers (0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday)
  minDaysFree?: number;
  minSeatsLeft?: number;
  minHonorsCourses?: number;
  nupaths?: string[];
};

// Helper function to check if a section conflicts with time constraints
const sectionMeetsTimeConstraints = (
  section: SectionWithCourse,
  startTime?: number,
  endTime?: number
): boolean => {
  if (startTime === undefined && endTime === undefined) return true;

  for (const meetingTime of section.meetingTimes) {
    // If any meeting is outside the allowed time range, reject
    if (startTime !== undefined && meetingTime.startTime < startTime) {
      return false;
    }
    if (endTime !== undefined && meetingTime.endTime > endTime) {
      return false;
    }
  }
  return true;
};

// Helper function to check if a section has classes on specific days
const sectionHasClassesOnDays = (section: SectionWithCourse, days: number[]): boolean => {
  for (const meetingTime of section.meetingTimes) {
    for (const day of meetingTime.days) {
      if (days.includes(day)) {
        return true;
      }
    }
  }
  return false;
};

// Check if a single section passes all filters
export const sectionPassesFilters = (
  section: SectionWithCourse,
  filters: ScheduleFilters
): boolean => {
  // Check time constraints (only if provided)
  if (filters.startTime !== undefined || filters.endTime !== undefined) {
    if (!sectionMeetsTimeConstraints(section, filters.startTime, filters.endTime)) {
      return false;
    }
  }

  // Check specific days free (only if provided)
  if (filters.specificDaysFree && filters.specificDaysFree.length > 0) {
    if (sectionHasClassesOnDays(section, filters.specificDaysFree)) {
      return false;
    }
  }

  // Check minimum seats left (only if provided)
  if (filters.minSeatsLeft !== undefined && section.seatRemaining < filters.minSeatsLeft) {
    return false;
  }

  return true;
};

// Get all days that a schedule occupies
const getOccupiedDays = (schedule: SectionWithCourse[]): Set<number> => {
  const occupiedDays = new Set<number>();
  for (const section of schedule) {
    for (const meetingTime of section.meetingTimes) {
      for (const day of meetingTime.days) {
        occupiedDays.add(day);
      }
    }
  }
  return occupiedDays;
};

// Check if a schedule fulfills all required NUPaths
const scheduleHasRequiredNupaths = (
  schedule: SectionWithCourse[],
  requiredNupaths: string[]
): boolean => {
  if (requiredNupaths.length === 0) return true;
  
  // Get all NUPaths fulfilled by courses in this schedule
  const scheduleNupaths = new Set<string>();
  for (const section of schedule) {
    if (section.courseNupaths) {
      section.courseNupaths.forEach(nupath => scheduleNupaths.add(nupath));
    }
  }
  
  // Check if all required NUPaths are fulfilled
  return requiredNupaths.every(nupath => scheduleNupaths.has(nupath));
};

// Check if a complete schedule passes all filters
export const schedulePassesFilters = (
  schedule: SectionWithCourse[],
  filters: ScheduleFilters
): boolean => {
  // First check that all sections individually pass
  if (!schedule.every(section => sectionPassesFilters(section, filters))) {
    return false;
  }

  // Check minimum days free (only if provided)
  if (filters.minDaysFree !== undefined) {
    const occupiedDays = getOccupiedDays(schedule);
    const totalDays = 7; // Monday through Sunday
    const daysFree = totalDays - occupiedDays.size;
    
    if (daysFree < filters.minDaysFree) {
      return false;
    }
  }

  // Check minimum honors courses (only if provided)
  if (filters.minHonorsCourses !== undefined) {
    const honorsCount = schedule.filter(section => section.honors).length;
    if (honorsCount < filters.minHonorsCourses) {
      return false;
    }
  }

  // Check NUPath requirements (only if provided)
  if (filters.nupaths && filters.nupaths.length > 0) {
    if (!scheduleHasRequiredNupaths(schedule, filters.nupaths)) {
      return false;
    }
  }

  return true;
};

// Apply filters to a list of schedules
export const filterSchedules = (
  schedules: SectionWithCourse[][],
  filters: ScheduleFilters
): SectionWithCourse[][] => {
  return schedules.filter(schedule => schedulePassesFilters(schedule, filters));
};