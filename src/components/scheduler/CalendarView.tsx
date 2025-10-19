"use client";

import { type SectionWithCourse } from "@/lib/scheduler/filters";

interface CalendarViewProps {
  schedule: SectionWithCourse[];
  scheduleNumber: number;
}

// Helper to convert time format (e.g., 1330 -> "1:30 PM")
function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert military time to minutes from midnight for positioning
function timeToMinutes(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 60 + minutes;
}

// All blocks use the same grey styling
function getCourseColor(): string {
  return "bg-gray-100 border border-gray-300 text-gray-900";
}

export function CalendarView({ schedule, scheduleNumber }: CalendarViewProps) {
  // Define time range (7 AM to 9 PM)
  const startHour = 7;
  const endHour = 21;
  const totalHours = endHour - startHour;
  
  // Define days
  const days = [
    { short: "SUN", full: "SUNDAY", index: 0 },
    { short: "MON", full: "MONDAY", index: 1 },
    { short: "TUE", full: "TUESDAY", index: 2 },
    { short: "WED", full: "WEDNESDAY", index: 3 },
    { short: "THU", full: "THURSDAY", index: 4 },
    { short: "FRI", full: "FRIDAY", index: 5 },
    { short: "SAT", full: "SATURDAY", index: 6 },
  ];

  // All courses use the same grey color
  const courseColor = getCourseColor();

  // Create time slots
  const timeSlots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    timeSlots.push(`${displayHour} ${period}`);
  }

  // Calculate position for a class block
  const getClassPosition = (startTime: number, endTime: number) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const startOfDay = startHour * 60;
    const totalMinutes = totalHours * 60;

    const top = ((startMinutes - startOfDay) / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;

    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className="h-full w-full rounded-lg border border-gray-300 bg-white overflow-hidden">
      {/* Calendar Grid */}
      <div className="grid grid-cols-[65px_repeat(7,1fr)] h-full">
        {/* Time Column */}
        <div className="bg-white">
          <div className="h-16 flex items-center justify-end pr-2 pb-3 text-xs font-semibold text-gray-500">
            [EST]
          </div>
          <div className="relative h-[calc(100%-4rem)]">
            {timeSlots.map((time, index) => {
              const hour = startHour + index;
              const isAfter8PM = hour > 20; // 20 is 8 PM
              return (
                <div
                  key={time}
                  className={`absolute w-full flex items-start justify-end pr-2 text-sm ${isAfter8PM ? 'text-transparent' : 'text-gray-600'}`}
                  style={{ top: `${(index / totalHours) * 100}%`, height: `${(1 / totalHours) * 100}%` }}
                >
                  <span className="-translate-y-1/2">{time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Columns */}
        {days.map((day, idx) => (
          <div key={day.index} className="relative bg-white">
            {/* Day Header */}
            <div className="h-16 border-b border-gray-300 flex items-center justify-center pb-3">
              <div className="text-sm font-semibold text-gray-500">{day.full}</div>
            </div>

            {/* Time Grid Lines */}
            <div className="relative h-[calc(100%-4rem)]">
              {timeSlots.map((_, index) => {
                const hour = startHour + index;
                const isAfter8PM = hour > 20; // 20 is 8 PM
                return (
                  <div
                    key={index}
                    className={`absolute w-full ${isAfter8PM ? 'border-b border-transparent' : 'border-b border-gray-200'}`}
                    style={{ top: `${(index / totalHours) * 100}%`, height: `${(1 / totalHours) * 100}%` }}
                  />
                );
              })}

              {/* Class Blocks */}
              {schedule.map((section, sectionIndex) => {
                return section.meetingTimes.map((meeting, meetingIndex) => {
                  if (!meeting.days.includes(day.index)) return null;

                  const position = getClassPosition(meeting.startTime, meeting.endTime);

                  return (
                    <div
                      key={`${sectionIndex}-${meetingIndex}`}
                      className={`absolute w-[calc(100%-8px)] mx-1 rounded-md ${courseColor} p-2 overflow-hidden`}
                      style={position}
                    >
                      <div className="text-base font-bold truncate text-black">
                        {section.courseSubject} {section.courseNumber}
                      </div>
                      <div className="text-sm truncate text-gray-600">
                        {section.courseName}
                      </div>
                      {section.faculty && (
                        <div className="text-sm truncate text-gray-600">
                          {section.faculty}
                        </div>
                      )}
                      <div className="text-sm mt-1 text-gray-600">
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
