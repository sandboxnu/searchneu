"use client";

import { useEffect, useRef } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { type CourseColor, getSectionColor } from "@/lib/scheduler/courseColors";

interface CalendarViewProps {
  schedule: SectionWithCourse[];
  scheduleNumber: number;
  colorMap: Map<string, CourseColor>;
}

// Height per hour in pixels - increase this to make rows taller
const HOUR_HEIGHT = 100;

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

export function CalendarView({ schedule, scheduleNumber, colorMap }: CalendarViewProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Define time range (6 AM to midnight)
  const startHour = 6;
  const endHour = 24;
  const totalHours = endHour - startHour;
  
  // Calculate minimum height based on hour height
  const minCalendarHeight = totalHours * HOUR_HEIGHT;
  
  // Separate async/remote courses from scheduled courses
  const asyncCourses = schedule.filter(section => 
    !section.meetingTimes || 
    section.meetingTimes.length === 0 || 
    section.meetingTimes.every(mt => !mt.days || mt.days.length === 0)
  );
  
  const scheduledCourses = schedule.filter(section => 
    section.meetingTimes && 
    section.meetingTimes.length > 0 && 
    section.meetingTimes.some(mt => mt.days && mt.days.length > 0)
  );
  
  // Auto-scroll to 7 AM on mount or when schedule changes
  useEffect(() => {
    if (calendarRef.current) {
      const asyncHeaderHeight = asyncCourses.length > 0 ? 80 : 0;
      const scrollPosition = 1 * HOUR_HEIGHT + 48 + asyncHeaderHeight + 8; // 7 AM is now 1 hour from start (6 AM)
      calendarRef.current.scrollTop = scrollPosition;
    }
  }, [scheduleNumber, asyncCourses.length]);
  
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
    <div 
      ref={calendarRef}
      className="h-full w-full rounded-lg border border-gray-300 bg-white overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {/* Calendar Grid */}
      <div className="relative">
        {/* Sticky Header Row - spans all columns */}
        <div className="sticky top-0 bg-white z-30 grid grid-cols-[65px_repeat(7,1fr)]">
          {/* Time Column Header */}
          <div className="bg-white">
            {!asyncCourses.length && (
              <div className="h-12 flex items-center justify-end pr-2 pb-1 text-sm font-semibold text-neu4">
                GMT-5
              </div>
            )}
          </div>
          
          {/* Day Headers */}
          {days.map((day) => (
            <div key={day.index} className="h-12 flex items-center justify-center pb-1 bg-white">
              <div className="text-sm font-semibold text-neu6">{day.full}</div>
            </div>
          ))}
        </div>

        {/* Async/Remote Courses Section - spans all day columns */}
        {asyncCourses.length > 0 && (
          <div className="sticky top-12 bg-white z-30 grid grid-cols-[65px_1fr] border-b border-gray-200">
            <div className="bg-white flex items-start justify-end pr-2 py-2">
              <div className="text-sm font-semibold text-neu4 h-[39px] flex items-center">GMT-5</div>
            </div>
            <div className="py-2 px-1 space-y-2">
              {asyncCourses.map((section, index) => {
                const sectionColor = getSectionColor(section, colorMap);
                return (
                  <div
                    key={index}
                    className="rounded-md p-2 px-3 flex items-center gap-3 border"
                    style={{
                      backgroundColor: sectionColor?.fill,
                      borderColor: sectionColor?.stroke,
                    }}
                  >
                    <div className="text-base font-bold truncate text-neu8">
                      {section.courseSubject} {section.courseNumber}
                    </div>
                    <div className="text-base truncate text-neu6">
                      CRN {section.crn}
                    </div>
                    <div className="text-base truncate text-neu6 italic">
                      Asynchronous
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-[65px_repeat(7,1fr)]" style={{ minHeight: `${minCalendarHeight}px` }}>
        {/* Time Column */}
        <div className="bg-white">
          <div className="relative h-[calc(100%-3rem)] mt-2">
            {timeSlots.map((time, index) => {
              return (
                <div
                  key={time}
                  className="absolute w-full flex items-start justify-end pr-2 text-sm text-neu6"
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
            {/* Time Grid Lines */}
            <div className="relative h-[calc(100%-3rem)] mt-2">
              {/* Top border for 12 AM */}
              <div className="absolute w-full border-t border-gray-200" style={{ top: '0%' }} />
              
              {timeSlots.map((_, index) => {
                const isLastSlot = index === timeSlots.length - 1;
                return (
                  <div
                    key={index}
                    className={`absolute w-full ${isLastSlot ? 'border-b border-transparent' : 'border-b border-gray-200'}`}
                    style={{ top: `${(index / totalHours) * 100}%`, height: `${(1 / totalHours) * 100}%` }}
                  />
                );
              })}

              {/* Class Blocks */}
              {scheduledCourses.map((section, sectionIndex) => {
                const sectionColor = getSectionColor(section, colorMap);
                return section.meetingTimes.map((meeting, meetingIndex) => {
                  if (!meeting.days.includes(day.index)) return null;

                  const position = getClassPosition(meeting.startTime, meeting.endTime);

                  return (
                    <div
                      key={`${sectionIndex}-${meetingIndex}`}
                      className="absolute w-[calc(100%-8px)] mx-1 rounded-md p-2 overflow-hidden border"
                      style={{
                        ...position,
                        backgroundColor: sectionColor?.fill,
                        borderColor: sectionColor?.stroke,
                      }}
                    >
                      <div className="text-base font-bold truncate text-neu8">
                        {section.courseSubject} {section.courseNumber}
                      </div>
                      <div className="text-base truncate text-neu6">
                        {section.courseName}
                      </div>
                      {section.faculty && (
                        <div className="text-base truncate text-neu6">
                          {section.faculty}
                        </div>
                      )}
                      <div className="text-base truncate text-neu6">
                        CRN {section.crn}
                      </div>
                      <div className="text-base mt-1 text-neu6">
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
    </div>
  );
}
