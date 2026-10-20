// ── OverridesRow ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { AuditCourse, Major, Minor } from "@/lib/graduate/types";
import { OVERRIDES_ID } from "@/lib/graduate/planUtils";
import { AuditCourseCard } from "./AuditCourseCard";
import AuditAddCoursesModal from "../modal/AuditAddCoursesModal";

/**
 * Styled like an AuditYearRow, but holds courses the student has credit for
 * without taking them in a term (e.g. an overridden coreq). There are no
 * semesters; courses here still count toward the audit.
 */
export function AuditOverridesRow({
  courses,
  expanded,
  majors,
  minors,
  onToggle,
  onRemoveCourse,
  onAddCourses,
}: {
  courses: AuditCourse[];
  expanded: boolean;
  majors: Major[];
  minors: Minor[];
  onToggle: () => void;
  onRemoveCourse: (courseIndex: number) => void;
  onAddCourses: (courses: AuditCourse[]) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: OVERRIDES_ID });

  const credits = courses.reduce((sum, c) => sum + c.numCreditsMin, 0);

  return (
    <div className="border-neu3 flex flex-col rounded-[8px] border-1 bg-white px-[24px] py-[16px]">
      <div
        className="flex cursor-pointer items-center justify-between rounded-[10px] bg-white transition-colors duration-150 select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-neu8 text-[16px] font-bold">
            Your Overridden Courses
          </span>
          <span className="text-neu6 bg-neu2 rounded-[8px] px-[8px] py-[4px] text-[12px]">
            {credits} {credits === 1 ? "credit" : "credits"} complete
          </span>
        </div>
      </div>

      {expanded && (
        <div
          ref={setNodeRef}
          className={`mt-2 grid grid-cols-4 gap-[8px] rounded-[8px] p-[6px] transition-colors duration-100 ${isOver ? "bg-neu2" : "bg-neu0"}`}
        >
          {courses.map((course, i) => (
            <AuditCourseCard
              key={course.id}
              course={course}
              onRemove={() => onRemoveCourse(i)}
            />
          ))}
          <button
            className="border-neu4 text-neu5 hover:border-blue/70 hover:text-blue w-full self-start rounded border border-dashed py-1.5 text-xs transition-colors"
            onClick={() => setModalOpen(true)}
          >
            + Add Course
          </button>
        </div>
      )}

      {modalOpen && (
        <AuditAddCoursesModal
          open={modalOpen}
          termLabel="Your Overridden Courses"
          majors={majors}
          minors={minors}
          onClose={() => setModalOpen(false)}
          onAddCourses={onAddCourses}
        />
      )}
    </div>
  );
}
