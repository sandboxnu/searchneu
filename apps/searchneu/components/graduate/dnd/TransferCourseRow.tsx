// ── TransferCourseRow ─────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AuditCourseCard } from "./AuditCourseCard";

export const TRANSFER_ZONE_ID = "transfer-courses";

export function TransferCourseRow({
  courses,
  expanded,
  onToggle,
  onRemoveCourse,
}: {
  courses: AuditCourse[];
  expanded: boolean;
  onToggle: () => void;
  onRemoveCourse: (courseIndex: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TRANSFER_ZONE_ID });
  const totalCredits = courses.reduce((sum, c) => sum + c.numCreditsMin, 0);

  return (
    <div ref={setNodeRef} className="flex flex-col">
      <div
        className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors duration-150 select-none ${expanded ? "bg-navy hover:bg-navy/80" : isOver ? "bg-blue/70" : "bg-blue hover:bg-blue/90"}`}
        onClick={onToggle}
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">
            Your Overriden Courses
          </span>
          <span className="text-sm text-white">
            {totalCredits} {totalCredits === 1 ? "Credit" : "Credits"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-white" />
        )}
      </div>

      {expanded && (
        <div
          className={`grid grid-cols-4 gap-2 px-3 py-3 transition-colors duration-100 ${isOver ? "bg-neu3" : "bg-neu25"}`}
        >
          {courses.map((course, i) => (
            <AuditCourseCard
              key={course.id ?? `${course.subject}-${course.classId}-${i}`}
              course={course}
              onRemove={() => onRemoveCourse(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
