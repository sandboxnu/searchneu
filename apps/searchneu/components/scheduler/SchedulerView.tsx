"use client";

import { useState, useMemo, useEffect } from "react";
import {
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { CalendarView } from "./CalendarView";
import { getCourseColorMap } from "@/lib/scheduler/courseColors";

// Helper to get unique courses from a schedule
function getCoursesFromSchedule(schedule: SectionWithCourse[]): string[] {
  const courses = schedule.map(
    (section) => `${section.courseSubject} ${section.courseNumber}`,
  );
  return Array.from(new Set(courses)).sort();
}

// Helper to create a key from course list
function getCourseGroupKey(courses: string[]): string {
  return courses.join("|");
}

// Helper to create a unique identifier for a schedule based on its CRNs
// This key ensures that the same schedule remains displayed when filters change,
// even if the schedule's position in the filtered list changes. By using CRNs
// instead of array indices, we can track and preserve the user's selected schedule
// across filter operations.
function getScheduleKey(schedule: SectionWithCourse[]): string {
  return schedule
    .map((section) => section.crn)
    .sort()
    .join("|");
}

// Group schedules by their course combinations
function groupSchedulesByCourses(
  schedules: SectionWithCourse[][],
): Map<string, SectionWithCourse[][]> {
  const groups = new Map<string, SectionWithCourse[][]>();

  for (const schedule of schedules) {
    const courses = getCoursesFromSchedule(schedule);
    const key = getCourseGroupKey(courses);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(schedule);
  }

  return groups;
}

interface SchedulerViewProps {
  schedules: SectionWithCourse[][];
  filters: ScheduleFilters;
}

export function SchedulerView({ schedules }: SchedulerViewProps) {
  const [selectedCourseGroupKey, setSelectedCourseGroupKey] = useState<
    string | null
  >(null);
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(
    null,
  );

  // Memoize the color map so it's only computed when schedules changes
  const colorMap = useMemo(() => getCourseColorMap(schedules), [schedules]);

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
    const index = courseGroups.findIndex(
      (g) => g.courseKey === selectedCourseGroupKey,
    );
    return index >= 0 ? index : 0;
  }, [selectedCourseGroupKey, courseGroups]);

  const currentCourseGroup = courseGroups[currentCourseGroupIndex];
  const displaySchedules = useMemo(
    () => currentCourseGroup?.schedules || [],
    [currentCourseGroup],
  );

  const currentScheduleIndex = useMemo(() => {
    if (!selectedScheduleKey || displaySchedules.length === 0) return 0;
    const index = displaySchedules.findIndex(
      (s) => getScheduleKey(s) === selectedScheduleKey,
    );
    return index >= 0 ? index : 0;
  }, [selectedScheduleKey, displaySchedules]);

  const currentSchedule = displaySchedules[currentScheduleIndex];

  // Auto-select the first course group and first schedule on initial load.
  // These useEffects only run when the keys are null (not yet selected).
  useEffect(() => {
    if (!selectedCourseGroupKey && courseGroups.length > 0) {
      // WARN: we should obv fix this and remove the ignore
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCourseGroupKey(courseGroups[0].courseKey);
    }
  }, [selectedCourseGroupKey, courseGroups]);

  useEffect(() => {
    if (!selectedScheduleKey && displaySchedules.length > 0) {
      // WARN: we should obv fix this and remove the ignore
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedScheduleKey(getScheduleKey(displaySchedules[0]));
    }
  }, [selectedScheduleKey, displaySchedules]);

  // Handle course group change
  const handleCourseGroupChange = (courseKey: string) => {
    setSelectedCourseGroupKey(courseKey);
    // Reset to first schedule of new course group
    const newGroup = courseGroups.find((g) => g.courseKey === courseKey);
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
    <div
      className="flex h-[calc(100vh-72px)] w-full flex-col px-6 py-4"
      style={{ backgroundColor: "#F8F9F9" }}
    >
      {/* Course Group Tabs (First Row) */}
      {courseGroups.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-2">
          {courseGroups.map((group, index) => (
            <button
              key={group.courseKey}
              onClick={() => handleCourseGroupChange(group.courseKey)}
              className={`text-neu8 flex items-center gap-2 rounded-lg border px-3 py-2 font-bold whitespace-nowrap ${
                currentCourseGroupIndex === index
                  ? "border-neu3 bg-white"
                  : "border-neu3 bg-neu2 hover:bg-neu3"
              } `}
            >
              {group.courses.map((course) => {
                const color = colorMap.get(course);
                return (
                  <div
                    key={course}
                    className="rounded-sm px-2 py-1 text-sm"
                    style={{
                      backgroundColor: color?.fill,
                      borderColor: color?.stroke,
                    }}
                  >
                    {course}
                  </div>
                );
              })}
            </button>
          ))}
        </div>
      )}

      {/* Schedule/Plan Tabs (Second Row) */}
      {displaySchedules.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto">
          {displaySchedules.map((schedule, index) => {
            const scheduleKey = getScheduleKey(schedule);
            return (
              <button
                key={scheduleKey}
                onClick={() => handleScheduleChange(scheduleKey)}
                className={`rounded-lg border px-4 py-2 font-bold whitespace-nowrap ${
                  currentScheduleIndex === index
                    ? "border-gray-300 bg-white text-gray-900"
                    : "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                } `}
              >
                Plan {index + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {hasSchedules && currentSchedule ? (
        <div className="flex-1 overflow-hidden">
          <CalendarView
            schedule={currentSchedule}
            scheduleNumber={currentScheduleIndex + 1}
            colorMap={colorMap}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          No schedules found. Try adjusting your filters or course selection.
        </div>
      )}
    </div>
  );
}
