"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { PlanTerm, PlanCourse } from "../../../lib/graduate/types";
import { getSeasonDisplayWord } from "../../../lib/graduate/planUtils";

interface ScheduleTermProps {
  scheduleTerm: PlanTerm;
  onRemoveCourse?: (course: PlanCourse) => void;
}

function PlanCourseCard({ course }: { course: PlanCourse }) {
  return (
    <div className="mb-1.5 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition-shadow last:mb-0">
      <span className="font-semibold text-blue-900">
        {course.subject} {course.classId}
      </span>
      {course.name && course.name !== `${course.subject} ${course.classId}` && (
        <span className="ml-2 truncate text-neutral-600">{course.name}</span>
      )}
    </div>
  );
}

export function ScheduleTerm({ scheduleTerm, onRemoveCourse }: ScheduleTermProps) {
  const { isOver, setNodeRef } = useDroppable({ id: scheduleTerm.id });
  const credits = scheduleTerm.classes.length * 4; // assume 4 credits per course for display

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
          />
        ))}
      </div>
    </div>
  );
}
