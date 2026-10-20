// ── CourseCard ────────────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import { useDraggable } from "@dnd-kit/core";
import { useCourseName } from "../CourseNameContext";
import { useCourseDetails } from "../CourseDetailsContext";
import { NUPATH_DISPLAY } from "@/lib/graduate/requirementUtils";
import { GripVertical, Check } from "lucide-react";
import { DeleteIcon } from "@/components/icons/Delete";

/**
 * One draggable course. Coreqs (e.g. CS 2000 + CS 2001) are separate
 * courses in the plan, so each one gets its own card.
 */
export function AuditCourseCard({
  course,
  onRemove,
  fulfilled,
}: {
  course: AuditCourse;
  onRemove?: () => void;
  fulfilled?: boolean;
}) {
  const details = useCourseDetails(course.subject, course.classId);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: course.id!,
    data: { course },
  });
  const name = useCourseName(course.subject, course.classId);
  const nupaths = (course.nupaths ?? details?.nupaths ?? []).filter(
    (code) => code in NUPATH_DISPLAY,
  );

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex w-full items-center justify-between rounded-[8px] border-[1px] text-[12px] transition-transform ${
        fulfilled ? "border-green/30 bg-green/10" : "bg-neu2 border-neu3"
      } ${isDragging ? "invisible" : ""}`}
      {...attributes}
    >
      <div
        className="flex min-w-0 flex-grow cursor-grab items-center p-2"
        {...listeners}
      >
        <GripVertical className="text-neu4 mt-0.5 mr-1.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <span
              className={`font-bold ${fulfilled ? "text-green" : "text-neu8"}`}
            >
              {course.subject}
              {course.classId}
            </span>
            <span
              className={`truncate leading-none ${fulfilled ? "text-green" : "text-neu6"}`}
            >
              {name}
            </span>
          </div>
          {nupaths.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {nupaths.map((code) => (
                <span
                  key={code}
                  title={NUPATH_DISPLAY[code] ?? code}
                  className="bg-neu3 text-neu7 rounded px-1 py-0.5 text-[10px] leading-none font-medium"
                >
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {fulfilled ? (
        <div className="shrink-0 pr-3">
          <Check className="text-green h-4 w-4" strokeWidth={2.5} />
        </div>
      ) : (
        onRemove && (
          <button
            className="text-neu4 hover:text-neu6 p-3 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onRemove}
            title="Remove course"
          >
            <DeleteIcon className="h-3 w-3" />
          </button>
        )
      )}
    </div>
  );
}

export function CourseCardOverlay({ course }: { course: AuditCourse }) {
  const name = useCourseName(course.subject, course.classId, course.name);
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
