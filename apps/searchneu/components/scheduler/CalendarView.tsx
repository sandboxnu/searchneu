"use client";

import { useState } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import {
  type CourseColor,
  getSectionColor,
} from "@/lib/scheduler/courseColors";
import { CourseInfoPopup } from "./CourseInfoPopup";

interface CalendarViewProps {
  schedule: SectionWithCourse[];
  colorMap: Map<string, CourseColor>;
}

// Height per hour in pixels - increase this to make rows taller
const HOUR_HEIGHT = 75;

// Helper to convert time format (e.g., 1330 -> "1:30 PM")
function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert military time to minutes from midnight for positioning
export function timeToMinutes(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 60 + minutes;
}

export function CalendarView({ schedule, colorMap }: CalendarViewProps) {
  // Define time range (7 AM to midnight)
  const startHour = 7;
  const endHour = 24;
  const totalHours = endHour - startHour;

  // Calculate minimum height based on hour height
  const minCalendarHeight = totalHours * HOUR_HEIGHT;

  const [popupState, setPopupState] = useState<{
    section: SectionWithCourse;
    rect: DOMRect;
  } | null>(null);

  const scheduledCourses = schedule.filter(
    (section) =>
      section.meetingTimes &&
      section.meetingTimes.length > 0 &&
      section.meetingTimes.some((mt) => mt.days && mt.days.length > 0),
  );

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

  // Create time slots
  const timeSlots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
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
    <div className="border-neu25 mb-4 w-full overflow-clip rounded-b-lg border-x border-b bg-white">
      {/* Calendar Grid */}
      <div className="relative">
        <div
          className="grid grid-cols-[65px_repeat(7,1fr)] pt-3"
          style={{ height: `${minCalendarHeight + 12}px` }}
        >
          {/* Time Column */}
          <div className="bg-white">
            <div className="relative h-full">
              {timeSlots.map((time, index) => {
                return (
                  <div
                    key={time}
                    className="text-neu6 absolute flex w-full items-start justify-end pr-2 text-sm"
                    style={{
                      top: `${(index / totalHours) * 100}%`,
                      height: `${(1 / totalHours) * 100}%`,
                    }}
                  >
                    <span className="-translate-y-1/2">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Columns */}
          {days.map((day) => (
            <div key={day.index} className="relative bg-white">
              {/* Time Grid Lines */}
              <div className="relative h-full">
                {/* Top border */}
                <div
                  className="absolute w-full border-t border-gray-200"
                  style={{ top: "0%" }}
                />

                {timeSlots.map((_, index) => {
                  const isLastSlot = index === timeSlots.length - 1;
                  return (
                    <div
                      key={index}
                      className={`absolute w-full ${isLastSlot ? "border-b border-transparent" : "border-b border-gray-200"}`}
                      style={{
                        top: `${(index / totalHours) * 100}%`,
                        height: `${(1 / totalHours) * 100}%`,
                      }}
                    />
                  );
                })}

                {/* Class Blocks */}
                {scheduledCourses.map((section, sectionIndex) => {
                  const sectionColor = getSectionColor(section, colorMap);
                  return section.meetingTimes.map((meeting, meetingIndex) => {
                    if (!meeting.days.includes(day.index)) return null;

                    const position = getClassPosition(
                      meeting.startTime,
                      meeting.endTime,
                    );

                    return (
                      <div
                        key={`${sectionIndex}-${meetingIndex}`}
                        className="absolute mx-1 flex w-[calc(100%-8px)] cursor-pointer items-stretch overflow-hidden rounded-lg p-2 transition-[filter] hover:brightness-95"
                        style={{
                          ...position,
                          backgroundColor: sectionColor?.fill,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopupState({
                            section,
                            rect: e.currentTarget.getBoundingClientRect(),
                          });
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          className="w-1 shrink-0 rounded-full"
                          style={{
                            backgroundColor: sectionColor?.stroke,
                          }}
                        />
                        {/* Content */}
                        {(() => {
                          const durationMinutes =
                            timeToMinutes(meeting.endTime) -
                            timeToMinutes(meeting.startTime);
                          const blockHeight =
                            (durationMinutes / (totalHours * 60)) *
                            minCalendarHeight;
                          const showAll = blockHeight >= 90;
                          return (
                            <div className="flex min-w-0 flex-col gap-0.5 py-0.5 pl-1.5">
                              <div className="text-neu8 truncate text-sm font-bold">
                                {section.courseSubject} {section.courseNumber}
                              </div>
                              {showAll && (
                                <div className="text-neu6 truncate text-sm">
                                  {section.courseName}
                                </div>
                              )}
                              {showAll && (
                                <div className="text-neu6 truncate text-sm">
                                  #{section.crn}
                                </div>
                              )}
                              <div className="text-neu6 truncate text-sm">
                                {formatTime(meeting.startTime)} –{" "}
                                {formatTime(meeting.endTime)}
                              </div>
                              {section.faculty && (
                                <div className="text-neu6 truncate text-sm">
                                  {section.faculty}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {popupState && (
        <CourseInfoPopup
          section={popupState.section}
          color={getSectionColor(popupState.section, colorMap)}
          anchorRect={popupState.rect}
          onClose={() => setPopupState(null)}
        />
      )}
    </div>
  );
}
