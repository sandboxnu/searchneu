"use client";

import {
  Audit,
  AuditCourse,
  AuditYear,
  SeasonEnum,
  AuditTerm,
  StatusEnum,
  INEUReqError,
} from "@/lib/graduate/types"; // ADJUST THIS PATH
import { createContext, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { produce } from "immer";
import { ScheduleYear, YearError } from "./AuditYear";

// ── Warning types ────────────────────────────────────────────────────────────

export interface ScheduleWarnings {
  type: string;
  years: YearError[];
}

export type PreReqWarnings = ScheduleWarnings & { type: "prereq" };
export type CoReqWarnings = ScheduleWarnings & { type: "coreq" };

// ── Contexts ─────────────────────────────────────────────────────────────────

export const TotalYearsContext = createContext<number | null>(null);
export const PlanContext = createContext<Audit<string> | null>(null);

// ── Helpers (inlined plan mutations) ─────────────────────────────────────────

function addClassesToTerm(
  classes: AuditCourse<null>[],
  termYear: number,
  termSeason: SeasonEnum,
  plan: Audit<string>,
): Audit<string> {
  return produce(plan, (draft) => {
    const year = draft.years.find((y) => y.year === termYear);
    if (!year) return;

    let term;
    switch (termSeason) {
      case SeasonEnum.FL:
        term = year.fall;
        break;
      case SeasonEnum.SP:
        term = year.spring;
        break;
      case SeasonEnum.S1:
        term = year.summer1;
        break;
      case SeasonEnum.S2:
        term = year.summer2;
        break;
      default:
        return;
    }

    const totalCourses = draft.years.reduce(
      (n, y) =>
        n +
        y.fall.classes.length +
        y.spring.classes.length +
        y.summer1.classes.length +
        y.summer2.classes.length,
      0,
    );

    let count = totalCourses;
    const dndClasses = classes.map((c) => {
      count++;
      return { ...c, id: `${c.classId}-${c.subject}-${count}` };
    });

    term.classes.push(...dndClasses);
  });
}

function removeCourseFromTerm(
  course: AuditCourse<unknown>,
  courseIndex: number,
  termYear: number,
  termSeason: SeasonEnum,
  plan: Audit<string>,
): Audit<string> {
  return produce(plan, (draft) => {
    const year = draft.years.find((y) => y.year === termYear);
    if (!year) return;

    let term;
    switch (termSeason) {
      case SeasonEnum.FL:
        term = year.fall;
        break;
      case SeasonEnum.SP:
        term = year.spring;
        break;
      case SeasonEnum.S1:
        term = year.summer1;
        break;
      case SeasonEnum.S2:
        term = year.summer2;
        break;
      default:
        return;
    }

    term.classes = term.classes.filter(
      (c, idx) =>
        idx !== courseIndex ||
        !(c.classId === course.classId && c.subject === course.subject),
    );
  });
}

function removeYearFromPlan(
  plan: Audit<string>,
  yearNum: number,
): Audit<string> {
  return produce(plan, (draft) => {
    const idx = yearNum - 1;
    if (idx >= draft.years.length) return;
    draft.years.splice(idx, 1);
    draft.years.forEach((y, i) => {
      y.year = i + 1;
    });
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuditPlanProps {
  plan: Audit<string>;
  preReqErr?: PreReqWarnings;
  coReqErr?: CoReqWarnings;
  catalogYear: number;
  setIsRemove?: (val: boolean) => void;
  mutatePlanWithUpdate: (updatedPlan: Audit<string>) => void;
  onErrorClick?: (course: AuditCourse<unknown>, err: INEUReqError) => void;
  renderAddCourse?: (season: SeasonEnum, yearNum: number) => React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

export const AuditPlan: React.FC<AuditPlanProps> = ({
  plan,
  mutatePlanWithUpdate,
  preReqErr,
  coReqErr,
  catalogYear,
  setIsRemove,
  onErrorClick,
  renderAddCourse,
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(),
  );
  const totalYears = plan.years.length;
  const { setNodeRef } = useDroppable({ id: "plan" });

  const toggleExpanded = (year: AuditYear<unknown>) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year.year)) next.delete(year.year);
      else next.add(year.year);
      return next;
    });
  };

  const addClassesToTermInCurrPlan = (
    classes: AuditCourse<null>[],
    termYear: number,
    termSeason: SeasonEnum,
  ) => {
    mutatePlanWithUpdate(addClassesToTerm(classes, termYear, termSeason, plan));
  };

  const removeCourseFromTermInCurrPlan = (
    course: AuditCourse<unknown>,
    courseIndex: number,
    termYear: number,
    termSeason: SeasonEnum,
  ) => {
    mutatePlanWithUpdate(
      removeCourseFromTerm(course, courseIndex, termYear, termSeason, plan),
    );
  };

  const removeYearFromCurrPlan = (yearNum: number) => {
    const updatedPlan = removeYearFromPlan(plan, yearNum);
    mutatePlanWithUpdate(updatedPlan);

    setExpandedYears((prev) => {
      const next = new Set<number>();
      for (let i = 1; i <= updatedPlan.years.length; i++) {
        if (i < yearNum && prev.has(i)) next.add(i);
        else if (i >= yearNum && prev.has(i + 1)) next.add(i);
      }
      return next;
    });
  };

  return (
    <TotalYearsContext.Provider value={totalYears}>
      <PlanContext.Provider value={plan}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5" ref={setNodeRef}>
            {plan.years.map((scheduleYear) => (
              <ScheduleYear
                key={scheduleYear.year}
                scheduleYear={scheduleYear}
                catalogYear={catalogYear}
                yearCoReqError={coReqErr?.years.find(
                  (y) => y.year === scheduleYear.year,
                )}
                yearPreReqError={preReqErr?.years.find(
                  (y) => y.year === scheduleYear.year,
                )}
                isExpanded={expandedYears.has(scheduleYear.year)}
                toggleExpanded={() => toggleExpanded(scheduleYear)}
                addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
                removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
                removeYearFromCurrPlan={() =>
                  removeYearFromCurrPlan(scheduleYear.year)
                }
                setIsRemove={setIsRemove}
                onErrorClick={onErrorClick}
                renderAddCourse={renderAddCourse}
              />
            ))}
          </div>

          {/* Add Year button */}
          <button
            className="rounded-lg border border-dashed border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
            onClick={() => {
              const nextYear = totalYears + 1;
              const emptyTerm = (season: SeasonEnum): AuditTerm<string> => ({
                season,
                status: StatusEnum.CLASSES,
                classes: [] as AuditCourse<string>[],
                id: `${nextYear}-${season}`,
              });
              const newYear: AuditYear<string> = {
                year: nextYear,
                fall: emptyTerm(SeasonEnum.FL),
                spring: emptyTerm(SeasonEnum.SP),
                summer1: emptyTerm(SeasonEnum.S1),
                summer2: emptyTerm(SeasonEnum.S2),
                isSummerFull: false,
              };
              const updatedPlan = produce(plan, (draft) => {
                draft.years.push(newYear);
              });
              mutatePlanWithUpdate(updatedPlan);
              setExpandedYears((prev) => new Set([...prev, nextYear]));
            }}
          >
            + Add Year
          </button>
        </div>
      </PlanContext.Provider>
    </TotalYearsContext.Provider>
  );
};
