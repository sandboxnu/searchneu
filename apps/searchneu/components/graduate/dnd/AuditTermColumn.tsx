import { AuditTerm } from "@/lib/graduate/types";
import { useDroppable } from "@dnd-kit/core";
import { SEASON_DISPLAY } from "@/lib/graduate/auditUtils";
import { AuditCourseCard } from "./AuditCourseCard";
import { Plus } from "lucide-react";

export function AuditTermColumn({
  term,
  onRemoveCourse,
}: {
  term: AuditTerm;
  onRemoveCourse: (courseIndex: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: term.id! });
  const seasonLabel = SEASON_DISPLAY[term.season] ?? term.season;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-[8px] rounded-[8px] p-[6px] transition-colors duration-100 ${isOver ? "bg-neu2" : "bg-neu0"}`}
    >
      <div className="text-neu6 flex items-start">
        <span className="text-[12px] font-bold tracking-wide uppercase">
          {seasonLabel}
        </span>
      </div>
      {term.classes.length > 0 && (
        <div className="flex flex-col gap-[4px]">
          {term.classes.map((course, i) => (
            <AuditCourseCard
              key={course.id}
              course={course}
              onRemove={() => onRemoveCourse(i)}
            />
          ))}
        </div>
      )}
      <button className="bg-neu0 text-neu7 border-neu3 flex w-full cursor-pointer items-center justify-center gap-1 rounded-[36px] border-1 py-2 transition-colors">
        <Plus className="h-4 w-4 shrink-0" />
        <span className="text-sm leading-none">Add Courses</span>
      </button>
    </div>
  );
}
