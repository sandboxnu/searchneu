// ── CourseCard ────────────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import { useDraggable } from "@dnd-kit/core";
import { useCourseName } from "../CourseNameContext";
import { GripVertical, X } from "lucide-react";

export function AuditCourseCard({
  course,
  onRemove,
}: {
  course: AuditCourse;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: course.id!,
    data: { course },
  });
  const name = useCourseName(course.subject, course.classId);

  return (
    <div
      ref={setNodeRef}
      className={`group bg-neu1 relative mb-1.5 flex w-full items-center justify-between rounded-lg text-sm transition-transform ${isDragging ? "invisible" : ""}`}
      {...attributes}
    >
      <div
        className="flex flex-grow cursor-grab items-center px-2 py-2"
        {...listeners}
      >
        <GripVertical className="text-neu5 mr-1.5 h-3 w-3 flex-shrink-0" />
        <p className="leading-tight">
          <span className="mr-1 font-bold">
            {course.subject}
            {course.classId}
          </span>
          <span>{name}</span>
        </p>
      </div>
      {onRemove && (
        <button
          className="text-neu5 hover:text-red p-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          title="Remove course"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function CourseCardOverlay({ course }: { course: AuditCourse }) {
  const name = useCourseName(course.subject, course.classId);
  return (
    <div className="bg-neu3 flex w-64 items-center rounded-lg px-2 py-2 text-sm shadow-lg">
      <GripVertical className="text-neu5 mr-1.5 h-3 w-3 flex-shrink-0" />
      <p className="leading-tight">
        <span className="mr-1 font-bold">
          {course.subject}
          {course.classId}
        </span>
        <span>{name}</span>
      </p>
    </div>
  );
}
