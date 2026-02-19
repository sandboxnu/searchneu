import React from "react";
import type {
  Requirement,
  IRequiredCourse,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  Section,
} from "../../../lib/graduate/types";
import { SIDEBAR_COURSE_DND_PREFIX } from "../../../lib/graduate/planUtils";
import SidebarSection from "./SidebarSection";
import { SidebarValidationStatus } from "../../../lib/graduate/types";
import { DraggableCourseCard } from "./DraggableCourseCard";

function formatCourse(course: IRequiredCourse): string {
  return `${course.subject} ${course.classId}`;
}

export interface SectionRequirementProps {
  requirement: Requirement;
  /** When set, COURSE requirements are rendered as draggable cards. Use a unique prefix per section/path (e.g. "s0-r0"). */
  dndIdPrefix?: string;
}

/**
 * Renders a single requirement (COURSE, AND, OR, XOM, RANGE, or nested SECTION).
 * When dndIdPrefix is provided, COURSE requirements are draggable into the plan.
 */
const SectionRequirement: React.FC<SectionRequirementProps> = ({
  requirement,
  dndIdPrefix,
}) => {
  const wrapperClass = "pl-1 pt-1";

  if (requirement.type === "COURSE") {
    const c = requirement as IRequiredCourse;
    const prefix = dndIdPrefix ?? "req";
    const dndId = `${SIDEBAR_COURSE_DND_PREFIX}${prefix}-${c.subject}-${c.classId}`;
    return (
      <div className={wrapperClass}>
        <DraggableCourseCard course={c} dndId={dndId} />
      </div>
    );
  }

  if (requirement.type === "AND") {
    const r = requirement as IAndCourse;
    return (
      <div className={wrapperClass}>
        <p className="text-sm italic text-neutral-700">
          Complete all of the following:
        </p>
        {r.courses.map((c, i) => (
          <SectionRequirement
            key={i}
            requirement={c}
            dndIdPrefix={dndIdPrefix ? `${dndIdPrefix}-${i}` : undefined}
          />
        ))}
      </div>
    );
  }

  if (requirement.type === "OR") {
    const r = requirement as IOrCourse;
    return (
      <div className={wrapperClass}>
        <p className="text-sm italic text-neutral-700">
          Complete 1 of the following:
        </p>
        {r.courses.map((c, i) => (
          <SectionRequirement
            key={i}
            requirement={c}
            dndIdPrefix={dndIdPrefix ? `${dndIdPrefix}-${i}` : undefined}
          />
        ))}
      </div>
    );
  }

  if (requirement.type === "XOM") {
    const r = requirement as IXofManyCourse;
    return (
      <div className={wrapperClass}>
        <p className="text-sm italic text-neutral-700">
          Complete {r.numCreditsMin} credits from the following:
        </p>
        {r.courses.map((c, i) => (
          <SectionRequirement
            key={i}
            requirement={c}
            dndIdPrefix={dndIdPrefix ? `${dndIdPrefix}-${i}` : undefined}
          />
        ))}
      </div>
    );
  }

  if (requirement.type === "RANGE") {
    const r = requirement as ICourseRange;
    return (
      <div className={wrapperClass}>
        <p className="text-sm italic text-neutral-700">
          Complete any course in range {r.subject}
          {r.idRangeStart} to {r.subject}
          {r.idRangeEnd}
          {r.exceptions.length > 0 && (
            <>
              {" "}
              except {r.exceptions.map(formatCourse).join(", ")}
            </>
          )}
        </p>
      </div>
    );
  }

  if (requirement.type === "SECTION") {
    const s = requirement as Section;
    return (
      <div className={wrapperClass}>
        <SidebarSection
          section={s}
          validationStatus={SidebarValidationStatus.Complete}
          defaultOpen={false}
        />
      </div>
    );
  }

  return null;
};

export default SectionRequirement;
