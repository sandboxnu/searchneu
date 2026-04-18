"use client";

import { useState } from "react";
import { Check, ChevronUp, ChevronDown } from "lucide-react";
import {
  AuditCourse,
  Section,
  Requirement,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  IRequiredCourse,
} from "@/lib/graduate/types";
import {
  sectionCompletion,
  isSectionComplete,
  isRequirementFulfilled,
} from "@/lib/graduate/requirementUtils";
import { courseToString } from "@/lib/graduate/auditUtils";
import { SIDEBAR_COURSE_PREFIX } from "@/lib/graduate/planUtils";
import { AuditCourseCard } from "../dnd/AuditCourseCard";

/** Create an AuditCourse from a requirement so it can be rendered by AuditCourseCard. */
function toAuditCourse(subject: string, classId: number): AuditCourse {
  return {
    name: "",
    classId: String(classId),
    subject,
    numCreditsMin: 0,
    numCreditsMax: 0,
    id: `${SIDEBAR_COURSE_PREFIX}${subject}-${classId}`,
  };
}

export function RequirementSection({
  section,
  scheduleCourses,
  defaultOpen = false,
}: {
  section: Section;
  scheduleCourses: Set<string>;
  defaultOpen?: boolean;
}) {
  const [opened, setOpened] = useState(defaultOpen);
  const { fulfilled, total } = sectionCompletion(section, scheduleCourses);
  const complete = isSectionComplete(section, scheduleCourses);

  return (
    <div className="select-none">
      <button
        type="button"
        className="hover:bg-neu25 flex w-full items-center justify-between px-4 py-3 transition-colors"
        onClick={() => setOpened(!opened)}
      >
        <div className="flex items-center gap-2">
          <span className="text-navy text-xs font-bold tracking-wide uppercase">
            {section.title}
          </span>
          {complete ? (
            <div className="bg-green flex h-5 w-5 items-center justify-center rounded-full text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </div>
          ) : (
            <span className="text-neu5 text-xs">
              ({fulfilled}/{total})
            </span>
          )}
        </div>
        {opened ? (
          <ChevronUp className="text-neu5 h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="text-neu5 h-4 w-4 shrink-0" />
        )}
      </button>

      {opened && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {section.minRequirementCount < section.requirements.length && (
            <p className="text-neu6 text-xs italic">
              Complete {section.minRequirementCount} of the following:
            </p>
          )}
          {section.requirements.map((req, i) => (
            <RequirementCard
              key={i}
              req={req}
              scheduleCourses={scheduleCourses}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RequirementCard({
  req,
  scheduleCourses,
}: {
  req: Requirement;
  scheduleCourses: Set<string>;
}) {
  if (req.type === "COURSE") {
    const c = req as IRequiredCourse;
    const inPlan = scheduleCourses.has(`${c.subject} ${c.classId}`);
    return (
      <AuditCourseCard
        course={toAuditCourse(c.subject, c.classId)}
        fulfilled={inPlan}
      />
    );
  }

  if (req.type === "AND") {
    const r = req as IAndCourse;
    const allCourses = r.courses.every((c) => c.type === "COURSE");
    if (allCourses && r.courses.length > 0) {
      const main = r.courses[0] as IRequiredCourse;
      const allInPlan = r.courses.every((c) => {
        const course = c as IRequiredCourse;
        return scheduleCourses.has(`${course.subject} ${course.classId}`);
      });
      const coreqs = r.courses.slice(1).map((c) => {
        const course = c as IRequiredCourse;
        return { subject: course.subject, classId: String(course.classId) };
      });
      return (
        <AuditCourseCard
          course={toAuditCourse(main.subject, main.classId)}
          fulfilled={allInPlan}
          coreqs={coreqs}
        />
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="text-neu6 text-xs italic">
          Complete all of the following:
        </p>
        {r.courses.map((c, i) => (
          <RequirementCard key={i} req={c} scheduleCourses={scheduleCourses} />
        ))}
      </div>
    );
  }

  if (req.type === "OR") {
    const r = req as IOrCourse;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-neu6 text-xs italic">(1) of the following:</p>
        {r.courses.map((c, i) => (
          <RequirementCard key={i} req={c} scheduleCourses={scheduleCourses} />
        ))}
      </div>
    );
  }

  if (req.type === "XOM") {
    const r = req as IXofManyCourse;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-neu6 text-xs italic">
          Complete {r.numCreditsMin} credits from:
        </p>
        {r.courses.map((c, i) => (
          <RequirementCard key={i} req={c} scheduleCourses={scheduleCourses} />
        ))}
      </div>
    );
  }

  if (req.type === "RANGE") {
    const r = req as ICourseRange;
    const fulfilled = isRequirementFulfilled(req, scheduleCourses);
    return (
      <div
        className={`rounded-[8px] border-[1px] px-3 py-2 text-[12px] ${
          fulfilled
            ? "border-green/30 bg-green/10 text-green"
            : "border-neu3 bg-neu2 text-neu6"
        }`}
      >
        Any {r.subject} {r.idRangeStart}&ndash;{r.idRangeEnd}
        {r.exceptions.length > 0 && (
          <span> except {r.exceptions.map(courseToString).join(", ")}</span>
        )}
      </div>
    );
  }

  if (req.type === "SECTION") {
    return (
      <RequirementSection
        section={req as Section}
        scheduleCourses={scheduleCourses}
      />
    );
  }

  return null;
}
