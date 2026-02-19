"use client";

import React, { useState } from "react";
import type { PlanYear, PlanCourse } from "../../../lib/graduate/types";
import { ScheduleTerm } from "./ScheduleTerm";

interface ScheduleYearProps {
  scheduleYear: PlanYear;
  onRemoveCourse?: (termId: string, courseId: string) => void;
}

export function ScheduleYear({ scheduleYear, onRemoveCourse }: ScheduleYearProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalCredits =
    scheduleYear.fall.classes.length * 4 + scheduleYear.spring.classes.length * 4;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full cursor-pointer items-center justify-between border-0 px-4 py-3 text-left transition-colors bg-blue-800"
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">Year {scheduleYear.year}</span>
          <span className="text-sm text-white">
            {totalCredits} {totalCredits === 1 ? "Credit" : "Credits"} Completed
          </span>
        </div>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`shrink-0 text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4 border border-neutral-200 border-t-0 bg-neutral-100 p-4">
          <ScheduleTerm
            scheduleTerm={scheduleYear.fall}
            onRemoveCourse={onRemoveCourse}
          />
          <ScheduleTerm
            scheduleTerm={scheduleYear.spring}
            onRemoveCourse={onRemoveCourse}
          />
        </div>
      )}
    </div>
  );
}
