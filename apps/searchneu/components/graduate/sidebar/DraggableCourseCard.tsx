"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { IRequiredCourse, PlanCourse } from "../../../lib/graduate/types";

export const DRAGGABLE_COURSE_DATA_TYPE = "application/x-plan-course";

export function requiredCourseToPlanCourse(
  c: IRequiredCourse,
  dndId: string
): PlanCourse {
  return {
    id: dndId,
    subject: c.subject,
    classId: String(c.classId),
    name: c.description ?? `${c.subject} ${c.classId}`,
  };
}

interface DraggableCourseCardProps {
  course: IRequiredCourse;
  dndId: string;
}

function formatCourse(course: IRequiredCourse): string {
  return `${course.subject} ${course.classId}`;
}

export function DraggableCourseCard({ course, dndId }: DraggableCourseCardProps) {
  const planCourse = requiredCourseToPlanCourse(course, dndId);
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: dndId,
    data: {
      type: DRAGGABLE_COURSE_DATA_TYPE,
      course: planCourse,
    },
  });

  return (
    <div ref={setNodeRef} className="pl-1 pt-1" {...attributes} {...listeners}>
      <div
        className={`cursor-grab rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm shadow-sm transition-all active:cursor-grabbing ${
          isDragging ? "opacity-30" : "hover:border-blue-300 hover:shadow"
        }`}
      >
        <span className="font-medium text-blue-900">{formatCourse(course)}</span>
        {course.description && (
          <p className="mt-0.5 text-sm italic text-neutral-600">
            {course.description}
          </p>
        )}
      </div>
    </div>
  );
}