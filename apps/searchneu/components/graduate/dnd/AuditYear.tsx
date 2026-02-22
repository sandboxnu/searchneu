"use client";

import {
  AuditCourse,
  AuditYear,
  SeasonEnum,
  INEUReqError,
} from "@/lib/graduate/types"; // ADJUST THIS PATH
import { useMemo } from "react";
import { ScheduleTerm } from "./AuditTerm";

// ── Warning types ────────────────────────────────────────────────────────────

export interface YearError {
  year: number;
  fall: Record<string, INEUReqError | undefined>;
  spring: Record<string, INEUReqError | undefined>;
  summer1: Record<string, INEUReqError | undefined>;
  summer2: Record<string, INEUReqError | undefined>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function totalCreditsInYear(year: AuditYear<unknown>): number {
  return [year.fall, year.spring, year.summer1, year.summer2].reduce(
    (sum, term) => sum + term.classes.reduce((s, c) => s + c.numCreditsMin, 0),
    0,
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ScheduleYearProps {
  scheduleYear: AuditYear<string>;
  catalogYear: number;
  yearCoReqError?: YearError;
  yearPreReqError?: YearError;
  isExpanded: boolean;
  toggleExpanded: () => void;
  setIsRemove?: (val: boolean) => void;

  addClassesToTermInCurrPlan: (
    classes: AuditCourse<null>[],
    termYear: number,
    termSeason: SeasonEnum,
  ) => void;

  removeCourseFromTermInCurrPlan: (
    course: AuditCourse<unknown>,
    courseIndex: number,
    termYear: number,
    termSeason: SeasonEnum,
  ) => void;

  removeYearFromCurrPlan: () => void;

  onErrorClick?: (course: AuditCourse<unknown>, err: INEUReqError) => void;
  renderAddCourse?: (season: SeasonEnum, yearNum: number) => React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ScheduleYear: React.FC<ScheduleYearProps> = ({
  scheduleYear,
  catalogYear,
  yearCoReqError,
  yearPreReqError,
  isExpanded,
  toggleExpanded,
  removeYearFromCurrPlan,
  addClassesToTermInCurrPlan,
  removeCourseFromTermInCurrPlan,
  setIsRemove,
  onErrorClick,
  renderAddCourse,
}) => {
  const credits = totalCreditsInYear(scheduleYear);

  const hasReqErrors = useMemo(() => {
    const errs = [
      ...Object.values(yearPreReqError?.fall ?? {}),
      ...Object.values(yearPreReqError?.spring ?? {}),
      ...Object.values(yearPreReqError?.summer1 ?? {}),
      ...Object.values(yearPreReqError?.summer2 ?? {}),
      ...Object.values(yearCoReqError?.fall ?? {}),
      ...Object.values(yearCoReqError?.spring ?? {}),
      ...Object.values(yearCoReqError?.summer1 ?? {}),
      ...Object.values(yearCoReqError?.summer2 ?? {}),
    ];
    return errs.some((e) => e != null);
  }, [yearCoReqError, yearPreReqError]);

  const terms = [
    {
      term: scheduleYear.fall,
      coReq: yearCoReqError?.fall,
      preReq: yearPreReqError?.fall,
    },
    {
      term: scheduleYear.spring,
      coReq: yearCoReqError?.spring,
      preReq: yearPreReqError?.spring,
    },
    {
      term: scheduleYear.summer1,
      coReq: yearCoReqError?.summer1,
      preReq: yearPreReqError?.summer1,
    },
    {
      term: scheduleYear.summer2,
      coReq: yearCoReqError?.summer2,
      preReq: yearPreReqError?.summer2,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Year Header */}
      <div
        className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors duration-150 select-none ${isExpanded ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600"} `}
        onClick={toggleExpanded}
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">
            Year {scheduleYear.year}
          </span>
          <span className="text-sm text-white">
            {credits} {credits === 1 ? "Credit" : "Credits"} Completed
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasReqErrors && (
            <span className="text-red-300" title="Prereq/coreq errors exist">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          )}
          <button
            className="p-1 text-white/70 transition-colors hover:text-red-300"
            title={`Delete Year ${scheduleYear.year}`}
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  `Delete Year ${scheduleYear.year}? All courses in this year will be removed.`,
                )
              ) {
                removeYearFromCurrPlan();
              }
            }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Term Grid */}
      {isExpanded && (
        <div className="grid min-h-[220px] grid-cols-4">
          {terms.map(({ term, coReq, preReq }) => (
            <ScheduleTerm
              key={term.id}
              scheduleTerm={term}
              catalogYear={catalogYear}
              yearNum={scheduleYear.year}
              termCoReqErr={coReq}
              termPreReqErr={preReq}
              addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
              removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
              setIsRemove={setIsRemove}
              onErrorClick={onErrorClick}
              renderAddCourse={renderAddCourse}
            />
          ))}
        </div>
      )}
    </div>
  );
};
