"use client";

import { useMemo, useState } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { type CourseColor, getSectionColor } from "@/lib/scheduler/courseColors";
import { getScheduleKey } from "@/lib/scheduler/scheduleKey";
import { CalendarView } from "./CalendarView";
import { CourseInfoPopup } from "./CourseInfoPopup";

interface SchedulerViewProps {
  schedules: SectionWithCourse[][];
  allSchedules: SectionWithCourse[][];
  selectedScheduleKey: string | null;
  colorMap: Map<string, CourseColor>;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function SchedulerView({
  schedules,
  allSchedules,
  selectedScheduleKey,
  colorMap,
  isFavorited,
  onToggleFavorite,
}: SchedulerViewProps) {
  const currentSchedule = useMemo(() => {
    if (!selectedScheduleKey) return schedules[0] ?? allSchedules[0] ?? null;
    // Search filtered first, then all schedules
    return (
      schedules.find((s) => getScheduleKey(s) === selectedScheduleKey) ??
      allSchedules.find((s) => getScheduleKey(s) === selectedScheduleKey) ??
      schedules[0] ??
      null
    );
  }, [selectedScheduleKey, schedules, allSchedules]);

  const currentScheduleIndex = useMemo(() => {
    if (!currentSchedule) return 0;
    const currentKey = getScheduleKey(currentSchedule);
    // Check filtered list first, then all
    const filteredIdx = schedules.findIndex(
      (s) => getScheduleKey(s) === currentKey,
    );
    if (filteredIdx >= 0) return filteredIdx;
    const allIdx = allSchedules.findIndex(
      (s) => getScheduleKey(s) === currentKey,
    );
    return allIdx >= 0 ? allIdx : 0;
  }, [currentSchedule, schedules, allSchedules]);

  const asyncCourses = useMemo(() => {
    if (!currentSchedule) return [];
    return currentSchedule.filter(
      (section) =>
        !section.meetingTimes ||
        section.meetingTimes.length === 0 ||
        section.meetingTimes.every((mt) => !mt.days || mt.days.length === 0),
    );
  }, [currentSchedule]);

  const [asyncPopupState, setAsyncPopupState] = useState<{
    section: SectionWithCourse;
    rect: DOMRect;
  } | null>(null);

  const hasSchedules = schedules.length > 0 && currentSchedule;

  return (
    <div
      className="flex h-[calc(100vh-72px)] w-full flex-col"
      style={{ backgroundColor: "#F8F9F9" }}
    >
      {/* Schedule Heading */}
      {hasSchedules && (
        <div className="mb-2">
          <p className="text-neu4 mb-1 text-sm font-bold uppercase">
            Plan {currentScheduleIndex + 1}
          </p>
          <div className="flex items-center gap-2">
          <h1 className="text-neu8 text-2xl font-bold">
            Schedule {currentScheduleIndex + 1}
          </h1>
          <button onClick={onToggleFavorite} className="cursor-pointer">
            <svg
              width="19"
              height="19"
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
      )}

      {/* Days of Week Header + Async Courses */}
      {hasSchedules && (
        <div className="rounded-t-lg border-x border-t border-neu25 bg-white">
          <div className="grid grid-cols-[65px_repeat(7,1fr)]">
            <div className="rounded-tl-lg bg-white">
              <div className="text-neu4 flex h-12 items-center justify-end pr-2 text-sm font-semibold">
                EST
              </div>
            </div>
            {[
              "SUNDAY",
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
            ].map((day) => (
              <div
                key={day}
                className={`flex h-12 items-center justify-center bg-white ${day === "SATURDAY" ? "rounded-tr-lg" : ""}`}
              >
                <div className="text-neu6 text-sm font-semibold">{day}</div>
              </div>
            ))}
          </div>
          {asyncCourses.length > 0 && (
            <div className="grid grid-cols-[65px_1fr]">
              <div />
              <div className="space-y-2 px-1 py-2">
                {asyncCourses.map((section, index) => {
                  const sectionColor = getSectionColor(section, colorMap);
                  return (
                    <div
                      key={index}
                      className="flex cursor-pointer items-stretch gap-0 rounded-lg px-2 py-1.5 transition-[filter] hover:brightness-95"
                      style={{ backgroundColor: sectionColor?.fill }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsyncPopupState({
                          section,
                          rect: e.currentTarget.getBoundingClientRect(),
                        });
                      }}
                    >
                      <div
                        className="w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: sectionColor?.stroke }}
                      />
                      <div className="flex items-center gap-3 pl-2">
                        <div className="text-neu8 truncate text-sm font-bold">
                          {section.courseSubject} {section.courseNumber}
                        </div>
                        <div className="text-neu6 truncate text-sm">
                          #{section.crn}
                        </div>
                        <div className="text-neu6 truncate text-sm italic">
                          Asynchronous
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {hasSchedules ? (
        <div className="min-h-0 flex-1 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CalendarView schedule={currentSchedule} colorMap={colorMap} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          No schedules found. Try adjusting your filters or course selection.
        </div>
      )}
      {asyncPopupState && (
        <CourseInfoPopup
          section={asyncPopupState.section}
          color={getSectionColor(asyncPopupState.section, colorMap)}
          anchorRect={asyncPopupState.rect}
          onClose={() => setAsyncPopupState(null)}
        />
      )}
    </div>
  );
}
