import {
  AuditCourse,
  AuditTerm,
  Major,
  Minor,
  TermError,
} from "@/lib/graduate/types";
import { useDroppable } from "@dnd-kit/core";
import { SEASON_DISPLAY } from "@/lib/graduate/auditUtils";
import { AuditCourseCard, CourseReqWarning } from "./AuditCourseCard";
import { useState } from "react";
import AuditAddCoursesModal from "../modal/AuditAddCoursesModal";

/**
 * Look up one course's prereq/coreq problems in this term. Errors are keyed
 * by "SUBJECT CLASSID" (e.g. "CS 2510"). Returns undefined when the course
 * has no problems, so its card shows no warning.
 */
function warningFor(
  course: AuditCourse,
  prereqErrors?: TermError,
  coreqErrors?: TermError,
): CourseReqWarning | undefined {
  const key = `${course.subject} ${course.classId}`;
  const prereq = prereqErrors?.[key];
  const coreq = coreqErrors?.[key];
  if (!prereq && !coreq) return undefined;
  return { prereq, coreq };
}

export function AuditTermColumn({
  term,
  termLabel,
  majors,
  minors,
  onRemoveCourse,
  onAddCourses,
  prereqErrors,
  coreqErrors,
}: {
  term: AuditTerm;
  termLabel: string;
  majors: Major[];
  minors: Minor[];
  onRemoveCourse: (courseIndex: number) => void;
  onAddCourses: (courses: AuditCourse[]) => void;
  /** Courses in this term scheduled before their prereqs. */
  prereqErrors?: TermError;
  /** Courses in this term missing a same-term coreq. */
  coreqErrors?: TermError;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: term.id! });
  const [modalOpen, setModalOpen] = useState(false);
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
      {term.classes.map((course, i) => (
        <AuditCourseCard
          key={course.id}
          course={course}
          onRemove={() => onRemoveCourse(i)}
          droppable
          warning={warningFor(course, prereqErrors, coreqErrors)}
        />
      ))}
      <button
        className="border-neu4 text-neu5 hover:border-blue/70 hover:text-blue mt-1 w-full rounded border border-dashed py-1.5 text-xs transition-colors"
        onClick={() => setModalOpen(true)}
      >
        + Add Course
      </button>

      {modalOpen && (
        <AuditAddCoursesModal
          open={modalOpen}
          termLabel={termLabel}
          majors={majors}
          minors={minors}
          onClose={() => setModalOpen(false)}
          onAddCourses={onAddCourses}
        />
      )}
    </div>
  );
}
