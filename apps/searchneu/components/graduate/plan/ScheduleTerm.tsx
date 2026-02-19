"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { PlanTerm, PlanCourse } from "../../../lib/graduate/types";
import { getSeasonDisplayWord } from "../../../lib/graduate/planUtils";

interface ScheduleTermProps {
  scheduleTerm: PlanTerm;
  onRemoveCourse?: (termId: string, courseId: string) => void;
}

function PlanCourseCard({
  course,
  onRemove,
}: {
  course: PlanCourse;
  onRemove?: () => void;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition-shadow last:mb-0 group">
      <span className="font-semibold text-blue-900">
        {course.subject} {course.classId}
      </span>
      {course.name && course.name !== `${course.subject} ${course.classId}` && (
        <span className="ml-2 truncate text-neutral-600">{course.name}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 shrink-0 rounded p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
          aria-label="Remove course"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 0 0-1.41 1.41L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.88a.996.996 0 1 0 1.41-1.41L13.41 12l4.88-4.89z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ScheduleTerm({ scheduleTerm, onRemoveCourse }: ScheduleTermProps) {
  const { isOver, setNodeRef } = useDroppable({ id: scheduleTerm.id });
  const credits = scheduleTerm.classes.length * 4;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[220px] flex-col rounded-lg border-2 px-3 pt-3 pb-4 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <div className="mb-2 flex items-baseline gap-2 pb-2">
        <span className="text-sm font-bold uppercase text-neutral-700">
          {getSeasonDisplayWord(scheduleTerm.season)}
        </span>
        <span className="text-xs font-medium text-blue-600">
          {credits} {credits === 1 ? "Credit" : "Credits"}
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        {scheduleTerm.classes.map((course) => (
          <PlanCourseCard
            key={course.id}
            course={course}
            onRemove={
              onRemoveCourse
                ? () => onRemoveCourse(scheduleTerm.id, course.id)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}