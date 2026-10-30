// ── CourseCard ────────────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { COURSE_DROP_PREFIX } from "@/lib/graduate/planUtils";
import { useCourseName } from "../CourseNameContext";
import { useCourseDetails } from "../CourseDetailsContext";
import { NUPATH_DISPLAY } from "@/lib/graduate/requirementUtils";
import { GripVertical, Check } from "lucide-react";
import { DeleteIcon } from "@/components/icons/Delete";

/**
 * One draggable course. Coreqs (e.g. CS 2000 + CS 2001) are separate
 * courses in the plan, so each one gets its own card.
 *
 * Cards in the plan are also drop targets (droppable), dropping another
 * course on one inserts it right before this card so courses
 * can be reordered within a term
 */
export function AuditCourseCard({
  course,
  onRemove,
  fulfilled,
  droppable = false,
}: {
  course: AuditCourse;
  onRemove?: () => void;
  fulfilled?: boolean;
  droppable?: boolean;
}) {
  const details = useCourseDetails(course.subject, course.classId);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: course.id!,
    data: { course },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${COURSE_DROP_PREFIX}${course.id}`,
    data: { courseId: course.id },
    disabled: !droppable,
  });
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };
  const name = useCourseName(course.subject, course.classId);
  const nupaths = (course.nupaths ?? details?.nupaths ?? []).filter(
    (code) => code in NUPATH_DISPLAY,
  );

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex w-full items-center justify-between rounded-[8px] border-[1px] text-[12px] transition-transform ${
        fulfilled ? "border-green/30 bg-green/10" : "bg-neu1 border-neu3"
      } ${isDragging ? "invisible" : ""}`}
      {...attributes}
    >
      {isOver && (
        <div className="bg-neu4 absolute -top-[5px] right-0 left-0 h-0.5 rounded-full" />
      )}
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
