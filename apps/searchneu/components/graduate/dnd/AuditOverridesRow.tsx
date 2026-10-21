// ── OverridesRow ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Info, Plus } from "lucide-react";
import { AuditCourse, Major, Minor } from "@/lib/graduate/types";
import { OVERRIDES_ID } from "@/lib/graduate/planUtils";
import { AuditCourseCard } from "./AuditCourseCard";
import AuditAddCoursesModal from "../modal/AuditAddCoursesModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="border-neu2 flex flex-col gap-4 rounded-[8px] border-1 bg-white px-[24px] py-[16px]">
      <div
        className="flex cursor-pointer items-center justify-between select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-neu8 text-[16px] leading-[1.2] font-bold">
            Overridden Courses
          </span>
          <span className="bg-neu1 text-neu6 rounded-[8px] px-[8px] py-[4px] text-[12px] leading-[1.5] font-semibold">
            {credits} {credits === 1 ? "credit" : "credits"}
          </span>
          <Tooltip>
            <TooltipTrigger
              // don't toggle the row when hovering/tapping the info icon
              onClick={(e) => e.stopPropagation()}
              render={
                <span className="flex items-center">
                  <Info className="text-neu5 h-[14px] w-[14px]" />
                </span>
              }
            />
            <TooltipContent>
              <p>
                These are courses you have attained prior credit for{" "}
                <span className="underline">or</span> have taken a substitute
                course for.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {expanded && (
        <>
          <div className="bg-neu3 h-[0.5px] w-full" />
          <div
            ref={setNodeRef}
            className={`flex flex-wrap items-center gap-x-[24px] gap-y-[4px] rounded-[8px] transition-colors duration-100 ${isOver ? "bg-neu2" : ""}`}
          >
            {courses.map((course, i) => (
              <div key={course.id} className="w-[235px]">
                <AuditCourseCard
                  course={course}
                  onRemove={() => onRemoveCourse(i)}
                />
              </div>
            ))}
            <button
              className="border-neu3 text-neu7 hover:bg-neu1 flex h-[26px] w-[235px] items-center justify-center gap-[6px] rounded-[36px] border-1 bg-white py-[4px] pr-[14px] pl-[10px] text-[12px] transition-colors"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-[11px] w-[11px]" />
              Add Courses
            </button>
          </div>
        </>
      )}

      {modalOpen && (
        <AuditAddCoursesModal
          open={modalOpen}
          termLabel="Overridden Courses"
          majors={majors}
          minors={minors}
          onClose={() => setModalOpen(false)}
          onAddCourses={onAddCourses}
        />
      )}
    </div>
  );
}
