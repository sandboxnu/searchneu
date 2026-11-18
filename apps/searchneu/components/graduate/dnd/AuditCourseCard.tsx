// ── CourseCard ────────────────────────────────────────────────────────────────

import { useContext } from "react";
import { AuditCourse, INEUReqError } from "@/lib/graduate/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { COURSE_DROP_PREFIX } from "@/lib/graduate/planUtils";
import { formatReqError } from "@/lib/graduate/reqWarnings";
import { CourseNameContext, useCourseName } from "../CourseNameContext";
import { useCourseDetails } from "../CourseDetailsContext";
import { NUPATH_DISPLAY } from "@/lib/graduate/requirementUtils";
import { GripVertical, Check, TriangleAlert } from "lucide-react";
import { DeleteIcon } from "@/components/icons/Delete";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Missing prereqs/coreqs for one course in a term. */
export interface CourseReqWarning {
  prereq?: INEUReqError;
  coreq?: INEUReqError;
}

/**
 * One draggable course. Coreqs (e.g. CS 2000 + CS 2001) are separate
 * courses in the plan, so each one gets its own card.
 *
 * Cards in the plan are also drop targets (droppable), dropping another
 * course on one inserts it right before this card so courses
 * can be reordered within a term
 *
 * `warning` is only passed for cards in term columns; sidebar and override
 * cards leave it undefined so they never show req warnings.
 */
export function AuditCourseCard({
  course,
  onRemove,
  fulfilled,
  droppable = false,
  warning,
}: {
  course: AuditCourse;
  onRemove?: () => void;
  fulfilled?: boolean;
  droppable?: boolean;
  warning?: CourseReqWarning;
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
  const showWarning = !fulfilled && !!(warning?.prereq || warning?.coreq);

  let cardColors = "bg-neu1 border-neu3";
  if (fulfilled) cardColors = "border-green/30 bg-green/10";
  else if (showWarning) cardColors = "border-yellow/50 bg-yellow/10";

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex w-full items-center justify-between rounded-[8px] border-[1px] text-[12px] transition-transform ${cardColors} ${isDragging ? "invisible" : ""}`}
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
      {showWarning && warning && <ReqWarningIcon warning={warning} />}
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

/** Warning icon with a tooltip listing the missing prereqs/coreqs. */
function ReqWarningIcon({ warning }: { warning: CourseReqWarning }) {
  const names = useContext(CourseNameContext);
  // Names are only preloaded for courses in the plan (and their coreqs);
  // anything else falls back to just "SUBJECT NUMBER".
  const nameOf = (subject: string, classId: string) =>
    names[`${subject}-${classId}`];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="shrink-0 pl-1"
              aria-label="Missing course requirements"
            >
              <TriangleAlert
                className="text-yellow h-4 w-4"
                strokeWidth={2.5}
              />
            </div>
          }
        />
        <TooltipContent>
          <div className="flex flex-col gap-1">
            {warning.prereq && (
              <p>Missing prereqs: {formatReqError(warning.prereq, nameOf)}</p>
            )}
            {warning.coreq && (
              <p>
                Missing coreq (same term):{" "}
                {formatReqError(warning.coreq, nameOf)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
