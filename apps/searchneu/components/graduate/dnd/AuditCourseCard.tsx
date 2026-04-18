// ── CourseCard ────────────────────────────────────────────────────────────────

import { AuditCourse } from "@/lib/graduate/types";
import type { Requisite } from "@sneu/scraper/types";
import { useDraggable } from "@dnd-kit/core";
import { useCourseName } from "../CourseNameContext";
import { useCourseDetails } from "../CourseDetailsContext";
import { NUPATH_DISPLAY } from "@/lib/graduate/requirementUtils";
import { GripVertical, Check } from "lucide-react";
import { DeleteIcon } from "@/components/icons/Delete";

/** Extract a flat list of {subject, classId} from a Requisite (coreqs JSON). */
function extractCoreqCourses(
  req?: Requisite,
): { subject: string; classId: string }[] {
  if (!req || typeof req !== "object") return [];
  if ("subject" in req && "courseNumber" in req) {
    return [{ subject: req.subject, classId: req.courseNumber }];
  }
  if ("type" in req && "items" in req) {
    return req.items.flatMap((item) => {
      if ("subject" in item && "courseNumber" in item) {
        return [{ subject: item.subject, classId: item.courseNumber }];
      }
      return [];
    });
  }
  return [];
}

export function AuditCourseCard({
  course,
  onRemove,
  fulfilled,
  coreqs: coreqsProp,
}: {
  course: AuditCourse;
  onRemove?: () => void;
  fulfilled?: boolean;
  coreqs?: { subject: string; classId: string }[];
}) {
  const details = useCourseDetails(course.subject, course.classId);
  const coreqs =
    coreqsProp ?? extractCoreqCourses(course.coreqs ?? details?.coreqs);
  // Enrich course with real credits from context so creditsInAudit works
  // immediately after a drag-drop (without waiting for a server reload).
  const enrichedCourse: AuditCourse = details
    ? {
        ...course,
        numCreditsMin: course.numCreditsMin || details.minCredits,
        numCreditsMax: course.numCreditsMax || details.maxCredits,
      }
    : course;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: course.id!,
    data: { course: enrichedCourse },
  });
  const name = useCourseName(course.subject, course.classId);
  const nupaths = (course.nupaths ?? []).filter(
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
          {coreqs.map((c, i) => (
            <CoreqLine
              key={i}
              subject={c.subject}
              classId={c.classId}
              fulfilled={fulfilled}
            />
          ))}
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

function CoreqLine({
  subject,
  classId,
  fulfilled,
}: {
  subject: string;
  classId: string;
  fulfilled?: boolean;
}) {
  const name = useCourseName(subject, classId);
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className={fulfilled ? "text-green" : "text-neu6"}>+</span>
      <span className={`font-bold ${fulfilled ? "text-green" : "text-neu8"}`}>
        {subject}
        {classId}
      </span>
      <span className={`truncate ${fulfilled ? "text-green" : "text-neu6"}`}>
        {name}
      </span>
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
