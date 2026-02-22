"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  AuditCourse,
  AuditTerm,
  SeasonEnum,
  INEUReqError,
  TermError,
} from "@/lib/graduate/types"; // ADJUST THIS PATH
import { DraggableScheduleCourse } from "./AuditCourse";

// ── Season Display ───────────────────────────────────────────────────────────

const SEASON_DISPLAY: Record<string, string> = {
  [SeasonEnum.FL]: "Fall",
  [SeasonEnum.SP]: "Spring",
  [SeasonEnum.S1]: "Summer I",
  [SeasonEnum.S2]: "Summer II",
};

function courseToString(c: {
  subject: string;
  classId: string | number;
}): string {
  return `${c.subject}${c.classId}`;
}

function totalCreditsInTerm(term: AuditTerm<unknown>): number {
  return term.classes.reduce((sum, c) => sum + c.numCreditsMin, 0);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ScheduleTermProps {
  scheduleTerm: AuditTerm<string>;
  catalogYear: number;
  yearNum: number;
  termCoReqErr?: TermError;
  termPreReqErr?: TermError;
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

  onErrorClick?: (course: AuditCourse<unknown>, err: INEUReqError) => void;
  renderAddCourse?: (season: SeasonEnum, yearNum: number) => React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ScheduleTerm: React.FC<ScheduleTermProps> = ({
  scheduleTerm,
  yearNum,
  termCoReqErr,
  termPreReqErr,
  setIsRemove,
  removeCourseFromTermInCurrPlan,
  onErrorClick,
  renderAddCourse,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: scheduleTerm.id });
  const credits = totalCreditsInTerm(scheduleTerm);
  const seasonDisplay =
    SEASON_DISPLAY[scheduleTerm.season] ?? scheduleTerm.season;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col px-3 pt-3 pb-6 transition-colors duration-100 select-none ${isOver ? "bg-gray-200" : "bg-gray-100"} `}
    >
      {/* Header */}
      <div className="flex items-start gap-2 pb-2">
        <span className="text-xs font-bold tracking-wide uppercase">
          {seasonDisplay}
        </span>
        <span className="text-xs font-medium text-blue-500">
          {credits} {credits === 1 ? "Credit" : "Credits"}
        </span>
      </div>

      {/* Courses */}
      {scheduleTerm.classes.map((course, courseIndex) => (
        <DraggableScheduleCourse
          key={course.id}
          scheduleCourse={course}
          scheduleTerm={scheduleTerm}
          coReqErr={termCoReqErr?.[courseToString(course)]}
          preReqErr={termPreReqErr?.[courseToString(course)]}
          isEditable
          setIsRemove={setIsRemove}
          removeCourse={(c: AuditCourse<unknown>) =>
            removeCourseFromTermInCurrPlan(
              c,
              courseIndex,
              yearNum,
              scheduleTerm.season,
            )
          }
          onErrorClick={onErrorClick}
        />
      ))}

      {/* Add course slot */}
      {renderAddCourse ? (
        renderAddCourse(scheduleTerm.season, yearNum)
      ) : (
        <button className="mt-1 w-full rounded border border-dashed border-gray-300 py-1.5 text-xs text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500">
          + Add Course
        </button>
      )}
    </div>
  );
};
