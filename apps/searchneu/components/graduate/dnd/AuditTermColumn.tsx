import { AuditTerm } from "@/lib/graduate/types";
import { useDroppable } from "@dnd-kit/core";
import { SEASON_DISPLAY } from "@/lib/graduate/auditUtils";
import { AuditCourseCard } from "./AuditCourseCard";

export function AuditTermColumn({
  term,
  onRemoveCourse,
}: {
  term: AuditTerm;
  onRemoveCourse: (courseIndex: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: term.id! });
  const credits = term.classes.reduce((s, c) => s + c.numCreditsMin, 0);
  const seasonLabel = SEASON_DISPLAY[term.season] ?? term.season;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col px-3 pt-3 pb-6 transition-colors duration-100 ${isOver ? "bg-neu3" : "bg-neu25"}`}
    >
      <div className="flex items-start gap-2 pb-2">
        <span className="text-xs font-bold tracking-wide uppercase">
          {seasonLabel}
        </span>
        <span className="text-blue text-xs font-medium">
          {credits} {credits === 1 ? "Credit" : "Credits"}
        </span>
      </div>
      {term.classes.map((course, i) => (
        <AuditCourseCard
          key={course.id}
          course={course}
          onRemove={() => onRemoveCourse(i)}
        />
      ))}
      <button className="border-neu4 text-neu5 hover:border-blue/70 hover:text-blue mt-1 w-full rounded border border-dashed py-1.5 text-xs transition-colors">
        + Add Course
      </button>
    </div>
  );
}
