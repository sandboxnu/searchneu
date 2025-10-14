"use client";

import { useState } from "react";
import { filterSchedules, type ScheduleFilters, type SectionWithCourse } from "@/lib/scheduler/filters";

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

// Convert time string (e.g., "09:00") to military format (e.g., 900)
function timeStringToMilitary(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 100 + minutes;
}

// Convert military time to time string
function militaryToTimeString(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function SchedulerView({ allSchedules }: { allSchedules: SectionWithCourse[][] }) {
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [showFilters, setShowFilters] = useState(true);

  // Apply filters
  const filteredSchedules = Object.keys(filters).length > 0
    ? filterSchedules(allSchedules, filters)
    : allSchedules;

  const updateFilter = <K extends keyof ScheduleFilters>(key: K, value: ScheduleFilters[K]) => {
    setFilters(prev => {
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => setFilters({});

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generated Schedules</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-6 bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Start Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Earliest Start Time
              </label>
              <input
                type="time"
                value={filters.startTime ? militaryToTimeString(filters.startTime) : ""}
                onChange={(e) => updateFilter("startTime", e.target.value ? timeStringToMilitary(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latest End Time
              </label>
              <input
                type="time"
                value={filters.endTime ? militaryToTimeString(filters.endTime) : ""}
                onChange={(e) => updateFilter("endTime", e.target.value ? timeStringToMilitary(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Days Free */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Days Free
              </label>
              <input
                type="number"
                min="0"
                max="7"
                value={filters.minDaysFree ?? ""}
                onChange={(e) => updateFilter("minDaysFree", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0-7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Seats Left */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Seats Available
              </label>
              <input
                type="number"
                min="0"
                value={filters.minSeatsLeft ?? ""}
                onChange={(e) => updateFilter("minSeatsLeft", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Honors Courses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Honors Courses
              </label>
              <input
                type="number"
                min="0"
                value={filters.minHonorsCourses ?? ""}
                onChange={(e) => updateFilter("minHonorsCourses", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Days Free Checkboxes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Days Free
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: "Sun" },
                { value: 1, label: "Mon" },
                { value: 2, label: "Tue" },
                { value: 3, label: "Wed" },
                { value: 4, label: "Thu" },
                { value: 5, label: "Fri" },
                { value: 6, label: "Sat" },
              ].map((day) => (
                <label key={day.value} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={filters.specificDaysFree?.includes(day.value) ?? false}
                    onChange={(e) => {
                      const currentDays = filters.specificDaysFree || [];
                      const newDays = e.target.checked
                        ? [...currentDays, day.value]
                        : currentDays.filter(d => d !== day.value);
                      updateFilter("specificDaysFree", newDays.length > 0 ? newDays : undefined);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">Active Filters:</h2>
          <div className="space-y-1 text-sm text-blue-800">
            {filters.startTime && (
              <div>• Earliest start time: {formatTime(filters.startTime)}</div>
            )}
            {filters.endTime && (
              <div>• Latest end time: {formatTime(filters.endTime)}</div>
            )}
            {filters.specificDaysFree && filters.specificDaysFree.length > 0 && (
              <div>• Days with no classes: {formatDays(filters.specificDaysFree)}</div>
            )}
            {filters.minDaysFree !== undefined && (
              <div>• Minimum days free per week: {filters.minDaysFree}</div>
            )}
            {filters.minSeatsLeft !== undefined && (
              <div>• Minimum seats available: {filters.minSeatsLeft}</div>
            )}
            {filters.minHonorsCourses !== undefined && (
              <div>• Minimum honors courses: {filters.minHonorsCourses}</div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-gray-600 mb-4">
        Found {filteredSchedules.length} valid schedule{filteredSchedules.length !== 1 ? "s" : ""} 
        {allSchedules.length !== filteredSchedules.length && ` (filtered from ${allSchedules.length} total)`}
        {" "}(showing first 5)
      </p>

      {/* Schedules */}
      <div className="space-y-8">
        {filteredSchedules.slice(0, 5).map((schedule, scheduleIndex) => (
          <div
            key={scheduleIndex}
            className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">
              Schedule {scheduleIndex + 1}
            </h2>

            <div className="space-y-4">
              {schedule.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {section.courseSubject} {section.courseNumber}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {section.courseName}
                      </p>
                      <span className="text-sm text-gray-700">
                        CRN: {section.crn}
                      </span>
                      {section.honors && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Honors
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {section.classType}
                    </span>
                  </div>

                  {section.faculty && (
                    <p className="text-sm text-gray-700 mb-1">
                      Instructor: {section.faculty}
                    </p>
                  )}

                  {section.meetingTimes.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {section.meetingTimes.map((meeting, meetingIndex) => (
                        <div
                          key={meetingIndex}
                          className="text-sm text-gray-700 flex items-center gap-2"
                        >
                          <span className="font-medium">
                            {formatDays(meeting.days)}
                          </span>
                          <span>•</span>
                          <span>
                            {formatTime(meeting.startTime)} -{" "}
                            {formatTime(meeting.endTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No scheduled meeting times
                    </p>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    Seats: {section.seatRemaining}/{section.seatCapacity} •
                    Campus: {section.campus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
