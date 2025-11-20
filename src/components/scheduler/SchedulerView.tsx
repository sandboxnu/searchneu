"use client";

import { useState, useMemo, useEffect } from "react";
import { type ScheduleFilters, type SectionWithCourse } from "@/lib/scheduler/filters";
import { CalendarView } from "./CalendarView";

// Helper to convert time format (e.g., 1330 -> "1:30 PM")
function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper to convert day numbers to day names
// Days are stored as: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
function formatDays(days: number[]): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}

// Helper to get unique courses from a schedule
function getCoursesFromSchedule(schedule: SectionWithCourse[]): string[] {
  const courses = schedule.map(section => 
    `${section.courseSubject} ${section.courseNumber}`
  );
  return Array.from(new Set(courses)).sort();
}

// Helper to create a key from course list
function getCourseKey(courses: string[]): string {
  return courses.join("|");
}

// Helper to create a unique identifier for a schedule based on its CRNs
// This key ensures that the same schedule remains displayed when filters change,
// even if the schedule's position in the filtered list changes. By using CRNs
// instead of array indices, we can track and preserve the user's selected schedule
// across filter operations.
function getScheduleKey(schedule: SectionWithCourse[]): string {
  return schedule.map(section => section.crn).sort().join("|");
}

// Group schedules by their course combinations
function groupSchedulesByCourses(schedules: SectionWithCourse[][]): Map<string, SectionWithCourse[][]> {
  const groups = new Map<string, SectionWithCourse[][]>();
  
  for (const schedule of schedules) {
    const courses = getCoursesFromSchedule(schedule);
    const key = getCourseKey(courses);
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(schedule);
  }
  
  return groups;
}

interface SchedulerViewProps {
  schedules: SectionWithCourse[][];
  totalSchedules: number;
  filters: ScheduleFilters;
}

export function SchedulerView({ schedules, totalSchedules, filters }: SchedulerViewProps) {
  const [selectedCourseGroupKey, setSelectedCourseGroupKey] = useState<string | null>(null);
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(null);
  
  // Group schedules by course combinations
  const courseGroups = useMemo(() => {
    const groups = groupSchedulesByCourses(schedules);
    return Array.from(groups.entries()).map(([key, schedules]) => ({
      courseKey: key,
      courses: key.split("|"),
      schedules,
    }));
  }, [schedules]);

  // Find the current course group and schedule indices based on keys
  // If the selected course group is not found (e.g., filtered out), falls back to first course group
  // If the selected schedule is not found (e.g., filtered out), falls back to first schedule of the current course group
  const currentCourseGroupIndex = useMemo(() => {
    if (!selectedCourseGroupKey || courseGroups.length === 0) return 0;
    const index = courseGroups.findIndex(g => g.courseKey === selectedCourseGroupKey);
    return index >= 0 ? index : 0;
  }, [selectedCourseGroupKey, courseGroups]);

  const currentCourseGroup = courseGroups[currentCourseGroupIndex];
  const displaySchedules = currentCourseGroup?.schedules || [];

  const currentScheduleIndex = useMemo(() => {
    if (!selectedScheduleKey || displaySchedules.length === 0) return 0;
    const index = displaySchedules.findIndex(s => getScheduleKey(s) === selectedScheduleKey);
    return index >= 0 ? index : 0;
  }, [selectedScheduleKey, displaySchedules]);

  const currentSchedule = displaySchedules[currentScheduleIndex];

  // Auto-select the first course group and first schedule on initial load.
  // These useEffects only run when the keys are null (not yet selected).
  useEffect(() => {
    if (!selectedCourseGroupKey && courseGroups.length > 0) {
      setSelectedCourseGroupKey(courseGroups[0].courseKey);
    }
  }, [selectedCourseGroupKey, courseGroups]);

  useEffect(() => {
    if (!selectedScheduleKey && displaySchedules.length > 0) {
      setSelectedScheduleKey(getScheduleKey(displaySchedules[0]));
    }
  }, [selectedScheduleKey, displaySchedules]);

  // Handle course group change
  const handleCourseGroupChange = (courseKey: string, index: number) => {
    setSelectedCourseGroupKey(courseKey);
    // Reset to first schedule of new course group
    const newGroup = courseGroups.find(g => g.courseKey === courseKey);
    if (newGroup && newGroup.schedules.length > 0) {
      setSelectedScheduleKey(getScheduleKey(newGroup.schedules[0]));
    }
  };

  // Handle schedule change
  const handleScheduleChange = (scheduleKey: string) => {
    setSelectedScheduleKey(scheduleKey);
  };

  // Show message if no schedules available
  const hasSchedules = courseGroups.length > 0 && displaySchedules.length > 0;

  return (
    <div className="h-[calc(100vh-72px)] w-full flex flex-col px-6 py-4" style={{ backgroundColor: '#F8F9F9' }}>
      {/* Course Group Tabs (First Row) */}
      {courseGroups.length > 0 && (
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
          {courseGroups.map((group, index) => (
            <button
              key={group.courseKey}
              onClick={() => handleCourseGroupChange(group.courseKey, index)}
              className={`
                px-4 py-2 rounded-lg border whitespace-nowrap font-bold
                ${currentCourseGroupIndex === index 
                  ? "bg-white border-gray-300 text-gray-900" 
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {group.courses.join(", ")}
            </button>
          ))}
        </div>
      )}

      {/* Schedule/Plan Tabs (Second Row) */}
      {displaySchedules.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {displaySchedules.map((schedule, index) => {
            const scheduleKey = getScheduleKey(schedule);
            return (
              <button
                key={scheduleKey}
                onClick={() => handleScheduleChange(scheduleKey)}
                className={`
                  px-4 py-2 rounded-lg border whitespace-nowrap font-bold
                  ${currentScheduleIndex === index 
                    ? "bg-white border-gray-300 text-gray-900" 
                    : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                Plan {index + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-sm font-semibold mb-1 text-blue-900">Active Filters:</h2>
          <div className="flex flex-wrap gap-2 text-xs text-blue-800">
            {filters.startTime && (
              <span className="bg-white px-2 py-1 rounded">Earliest: {formatTime(filters.startTime)}</span>
            )}
            {filters.endTime && (
              <span className="bg-white px-2 py-1 rounded">Latest: {formatTime(filters.endTime)}</span>
            )}
            {filters.specificDaysFree && filters.specificDaysFree.length > 0 && (
              <span className="bg-white px-2 py-1 rounded">Days Free: {formatDays(filters.specificDaysFree)}</span>
            )}
            {filters.minDaysFree !== undefined && (
              <span className="bg-white px-2 py-1 rounded">Min Days Free: {filters.minDaysFree}</span>
            )}
            {filters.minSeatsLeft !== undefined && (
              <span className="bg-white px-2 py-1 rounded">Min Seats: {filters.minSeatsLeft}</span>
            )}
            {filters.includeHonors !== undefined && (
              <span className="bg-white px-2 py-1 rounded">
                {filters.includeHonors ? "Includes Honors Courses" : "Excludes Honors Courses"}
              </span>
            )}
            {filters.nupaths && filters.nupaths.length > 0 && (
              <span className="bg-white px-2 py-1 rounded">NUPaths: {filters.nupaths.join(", ")}</span>
            )}
            {filters.includesOnline !== undefined && (
              <span className="bg-white px-2 py-1 rounded">
                {filters.includesOnline ? "Includes Online Courses" : "Excludes Online Courses"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {hasSchedules && currentSchedule ? (
        <div className="flex-1 overflow-hidden">
          <CalendarView schedule={currentSchedule} scheduleNumber={currentScheduleIndex + 1} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No schedules found. Try adjusting your filters or course selection.
        </div>
      )}
    </div>
  );
}
