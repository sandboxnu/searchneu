"use client";

import {
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";

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

export function SchedulerView({
  schedules,
  totalSchedules,
  filters,
}: SchedulerViewProps) {
  return (
    <div className="h-[calc(100vh-72px)] w-full space-y-4 overflow-y-scroll px-6 py-4">
      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-blue-900">
            Active Filters:
          </h2>
          <div className="space-y-1 text-sm text-blue-800">
            {filters.startTime && (
              <div>• Earliest start time: {formatTime(filters.startTime)}</div>
            )}
            {filters.endTime && (
              <div>• Latest end time: {formatTime(filters.endTime)}</div>
            )}
            {filters.specificDaysFree &&
              filters.specificDaysFree.length > 0 && (
                <div>
                  • Days with no classes: {formatDays(filters.specificDaysFree)}
                </div>
              )}
            {filters.minDaysFree !== undefined && (
              <div>• Minimum days free per week: {filters.minDaysFree}</div>
            )}
            {filters.isOnline !== undefined && (
              <div>• Online Classes Included: {filters.isOnline}</div>
            )}
            {filters.minSeatsLeft !== undefined && (
              <div>• Minimum seats available: {filters.minSeatsLeft}</div>
            )}
            {filters.minHonorsCourses !== undefined && (
              <div>• Minimum honors courses: {filters.minHonorsCourses}</div>
            )}
            {filters.nupaths && filters.nupaths.length > 0 && (
              <div>• NUPath requirements: {filters.nupaths.join(", ")}</div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-gray-600">
        Found {schedules.length} valid schedule
        {schedules.length !== 1 ? "s" : ""}
        {totalSchedules !== schedules.length &&
          ` (filtered from ${totalSchedules} total)`}
      </p>

      {/* Schedules */}
      <div className="space-y-8">
        {schedules.map((schedule, scheduleIndex) => (
          <div
            key={scheduleIndex}
            className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-xl font-semibold">
              Schedule {scheduleIndex + 1}
            </h2>

            <div className="space-y-4">
              {schedule.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="border-l-4 border-blue-500 py-2 pl-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {section.courseSubject} {section.courseNumber}
                      </h3>
                      <p className="mb-1 text-sm text-gray-600">
                        {section.courseName}
                      </p>
                      <span className="text-sm text-gray-700">
                        CRN: {section.crn}
                      </span>
                      {section.honors && (
                        <span className="ml-2 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                          Honors
                        </span>
                      )}
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                      {section.classType}
                    </span>
                  </div>

                  {section.faculty && (
                    <p className="mb-1 text-sm text-gray-700">
                      Instructor: {section.faculty}
                    </p>
                  )}

                  {section.meetingTimes.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {section.meetingTimes.map((meeting, meetingIndex) => (
                        <div
                          key={meetingIndex}
                          className="flex items-center gap-2 text-sm text-gray-700"
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
