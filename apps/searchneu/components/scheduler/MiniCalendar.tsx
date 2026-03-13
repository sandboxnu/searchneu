"use client";

import { memo } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import {
  type CourseColor,
  getSectionColor,
} from "@/lib/scheduler/courseColors";
import { timeToMinutes } from "./CalendarView";

interface MiniCalendarProps {
  schedule: SectionWithCourse[];
  colorMap: Map<string, CourseColor>;
  isSelected: boolean;
  isFavorited: boolean;
  scheduleIndex: number;
  onClick: () => void;
  onToggleFavorite: () => void;
}

const MINI_START_HOUR = 7;
const MINI_END_HOUR = 24;
const MINI_TOTAL_MINUTES = (MINI_END_HOUR - MINI_START_HOUR) * 60;
const MINI_CALENDAR_HEIGHT = 122;

const DAYS = [
  { short: "S", index: 0 },
  { short: "M", index: 1 },
  { short: "T", index: 2 },
  { short: "W", index: 3 },
  { short: "TH", index: 4 },
  { short: "F", index: 5 },
  { short: "S", index: 6 },
];

function getMiniPosition(startTime: number, endTime: number) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOfDay = MINI_START_HOUR * 60;

  const top =
    ((startMinutes - startOfDay) / MINI_TOTAL_MINUTES) * MINI_CALENDAR_HEIGHT;
  const height = Math.max(
    ((endMinutes - startMinutes) / MINI_TOTAL_MINUTES) * MINI_CALENDAR_HEIGHT,
    3,
  );

  return { top: `${top}px`, height: `${height}px` };
}

export const MiniCalendar = memo(function MiniCalendar({
  schedule,
  colorMap,
  isSelected,
  isFavorited,
  scheduleIndex,
  onClick,
  onToggleFavorite,
}: MiniCalendarProps) {
  const asyncCourses = schedule.filter(
    (section) =>
      !section.meetingTimes ||
      section.meetingTimes.length === 0 ||
      section.meetingTimes.every((mt) => !mt.days || mt.days.length === 0),
  );

  const scheduledCourses = schedule.filter(
    (section) =>
      section.meetingTimes &&
      section.meetingTimes.length > 0 &&
      section.meetingTimes.some((mt) => mt.days && mt.days.length > 0),
  );

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`w-full cursor-pointer rounded-lg border p-2 text-left transition-colors ${
        isSelected
          ? "border-neu4 bg-white"
          : "border-neu25 hover:border-neu3 bg-white"
      }`}
    >
      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-0">
        {DAYS.map((day, i) => {
          const hasClasses = scheduledCourses.some((section) =>
            section.meetingTimes.some((mt) => mt.days.includes(day.index)),
          );
          return (
            <div
              key={i}
              className={`text-center text-[14px] font-semibold ${
                hasClasses ? "text-neu7" : "text-neu4"
              }`}
            >
              {day.short}
            </div>
          );
        })}
      </div>

      {/* Async/Online courses */}
      {asyncCourses.length > 0 && (
        <div className="mb-1 space-y-0.5">
          {asyncCourses.map((section, idx) => {
            const sectionColor = getSectionColor(section, colorMap);
            return (
              <div
                key={idx}
                className="h-2 rounded-[2px]"
                style={{
                  backgroundColor: sectionColor?.stroke,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Mini calendar grid */}
      <div
        className="relative grid grid-cols-7 gap-0"
        style={{ height: `${MINI_CALENDAR_HEIGHT}px` }}
      >
        {DAYS.map((day, dayIdx) => (
          <div key={dayIdx} className="relative h-full">
            {scheduledCourses.map((section, sectionIdx) => {
              const sectionColor = getSectionColor(section, colorMap);
              return section.meetingTimes.map((meeting, meetingIdx) => {
                if (!meeting.days.includes(day.index)) return null;
                const position = getMiniPosition(
                  meeting.startTime,
                  meeting.endTime,
                );
                return (
                  <div
                    key={`${sectionIdx}-${meetingIdx}`}
                    className="absolute inset-x-px rounded-[2px]"
                    style={{
                      ...position,
                      backgroundColor: sectionColor?.stroke,
                    }}
                  />
                );
              });
            })}
          </div>
        ))}
      </div>

      {/* Footer with plan label and star */}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-neu7 text-xs font-semibold">
          Schedule {scheduleIndex + 1}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="cursor-pointer p-0.5"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill={isFavorited ? "#E63946" : "none"}
            stroke={isFavorited ? "#E63946" : "#858585"}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>
    </div>
  );
});
