"use client";

import { useState } from "react";
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

interface SchedulerViewProps {
  schedules: SectionWithCourse[][];
  totalSchedules: number;
  filters: ScheduleFilters;
}

export function SchedulerView({ schedules, totalSchedules, filters }: SchedulerViewProps) {
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);

  // Limit to first 8 schedules for tabs
  const displaySchedules = schedules;
  const currentSchedule = displaySchedules[selectedScheduleIndex];

  return (
    <div className="h-[calc(100vh-72px)] w-full flex flex-col px-6 py-4" style={{ backgroundColor: '#F8F9F9' }}>
      {/* Schedule Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {displaySchedules.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedScheduleIndex(index)}
            className={`
              px-4 py-2 rounded-lg border whitespace-nowrap font-bold
              ${selectedScheduleIndex === index 
                ? "bg-white border-gray-300 text-gray-900" 
                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            Plan {index + 1}
          </button>
        ))}
      </div>

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-blue-900">
            Active Filters:
          </h2>
          <div className="space-y-1 text-sm text-blue-800">
            {filters.startTime && (
              <span className="bg-white px-2 py-1 rounded">Earliest: {formatTime(filters.startTime)}</span>
            )}
            {filters.endTime && (
              <span className="bg-white px-2 py-1 rounded">Latest: {formatTime(filters.endTime)}</span>
            )}
            {filters.specificDaysFree &&
              filters.specificDaysFree.length > 0 && (
                <div>
                  • Days with no classes: {formatDays(filters.specificDaysFree)}
                </div>
              )}
            {filters.minDaysFree !== undefined && (
              <span className="bg-white px-2 py-1 rounded">Min Days Free: {filters.minDaysFree}</span>
            )}
            {filters.isOnline !== undefined && (
              <div>• Online Classes Included: {filters.isOnline}</div>
            )}
            {filters.minSeatsLeft !== undefined && (
              <span className="bg-white px-2 py-1 rounded">Min Seats: {filters.minSeatsLeft}</span>
            )}
            {filters.minHonorsCourses !== undefined && (
              <span className="bg-white px-2 py-1 rounded">Min Honors: {filters.minHonorsCourses}</span>
            )}
            {filters.nupaths && filters.nupaths.length > 0 && (
              <span className="bg-white px-2 py-1 rounded">NUPaths: {filters.nupaths.join(", ")}</span>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {currentSchedule ? (
        <div className="flex-1 overflow-hidden">
          <CalendarView schedule={currentSchedule} scheduleNumber={selectedScheduleIndex + 1} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No schedules found. Try adjusting your filters or course selection.
        </div>
      )}
    </div>
  );
}
