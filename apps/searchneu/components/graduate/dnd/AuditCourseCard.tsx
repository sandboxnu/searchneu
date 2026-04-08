// ── CourseCard ────────────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import { useDraggable } from "@dnd-kit/core";
import { useCourseName } from "../CourseNameContext";
import { GripVertical } from "lucide-react";
import { DeleteIcon } from "@/components/icons/Delete";

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
      className={`group bg-neu2 border-neu3 relative flex w-full items-center justify-between rounded-[8px] border-[1px] text-[12px] transition-transform ${isDragging ? "invisible" : ""}`}
      {...attributes}
    >
      <div
        className="flex min-w-0 flex-grow cursor-grab items-center p-2"
        {...listeners}
      >
        <GripVertical className="text-neu4 mr-1.5 h-4 w-4 flex-shrink-0" />
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-neu8 font-bold">
            {course.subject}
            {course.classId}
          </span>
          <span className="text-neu6 truncate leading-none">{name}</span>
        </div>
      </div>
      {onRemove && (
        <button
          className="text-neu4 hover:text-neu6 p-3 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          title="Remove course"
        >
          <DeleteIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function CourseCardOverlay({ course }: { course: AuditCourse }) {
  const name = useCourseName(course.subject, course.classId);
  return (
    <div className="bg-neu3 flex w-64 items-center rounded-lg px-2 py-2 text-sm shadow-lg">
      <GripVertical className="text-neu4 mr-1.5 h-4 w-4 flex-shrink-0" />
      <div className="flex min-w-0 items-center gap-1">
        <span className="text-neu8 font-bold">
          {course.subject}
          {course.classId}
        </span>
        <span className="text-neu6 truncate">{name}</span>
      </div>
    </div>
  );
}
