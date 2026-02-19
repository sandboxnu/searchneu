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

function formatCourse(course: IRequiredCourse): string {
  return `${course.subject} ${course.classId}`;
}

interface RequirementItemProps {
  requirement: Requirement;
  depth?: number;
}

/** Renders a single requirement (course, AND/OR/XOM/RANGE, or nested section). */
export function RequirementItem({
  requirement,
  depth = 0,
}: RequirementItemProps): React.ReactElement | null {
  const pad = depth > 0 ? "pl-3 border-l-2 border-neutral-200 ml-1" : "";
  const listClass = "text-sm text-neutral-700 space-y-1.5";

  if (requirement.type === "COURSE") {
    const c = requirement as IRequiredCourse;
    return (
      <div className={`text-sm text-neutral-700 ${pad}`}>
        <span className="font-medium text-blue-900">{formatCourse(c)}</span>
        {c.description && (
          <p className="text-neutral-600 italic mt-0.5">{c.description}</p>
        )}
      </div>
    );
  }

  if (requirement.type === "AND") {
    const r = requirement as IAndCourse;
    return (
      <div className={pad}>
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1">
          All of:
        </p>
        <ul className={`${listClass} list-disc list-inside`}>
          {r.courses.map((c, i) => (
            <li key={i}>
              <RequirementItem requirement={c} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (requirement.type === "OR") {
    const r = requirement as IOrCourse;
    return (
      <div className={pad}>
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1">
          One of:
        </p>
        <ul className={`${listClass} list-disc list-inside`}>
          {r.courses.map((c, i) => (
            <li key={i}>
              <RequirementItem requirement={c} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (requirement.type === "XOM") {
    const r = requirement as IXofManyCourse;
    return (
      <div className={pad}>
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1">
          {r.numCreditsMin} credit{r.numCreditsMin !== 1 ? "s" : ""} from:
        </p>
        <ul className={`${listClass} list-disc list-inside`}>
          {r.courses.map((c, i) => (
            <li key={i}>
              <RequirementItem requirement={c} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (requirement.type === "RANGE") {
    const r = requirement as ICourseRange;
    const rangeText = `${r.subject} ${r.idRangeStart}-${r.idRangeEnd}`;
    return (
      <div className={pad}>
        <p className="text-sm text-neutral-700">
          <span className="font-medium text-blue-900">{rangeText}</span>
        </p>
        {r.exceptions.length > 0 && (
          <p className="text-xs text-neutral-500 mt-1">
            Exceptions: {r.exceptions.map(formatCourse).join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (requirement.type === "SECTION") {
    const s = requirement as Section;
    return (
      <div className={pad}>
        <p className="text-xs font-semibold text-blue-900 mb-1">{s.title}</p>
        <SectionRequirements requirements={s.requirements} depth={depth + 1} />
      </div>
    );
  }

  return null;
}

interface SectionRequirementsProps {
  requirements: Requirement[];
  depth?: number;
}

/** Renders the list of requirements for a section (used in sidebar and inside nested SECTION). */
export function SectionRequirements({
  requirements,
  depth = 0,
}: SectionRequirementsProps): React.ReactElement {
  if (!requirements?.length) {
    return (
      <p className="text-sm italic text-neutral-500 pl-1">No requirements</p>
    );
  }

  return (
    <ul className="space-y-2 list-none pl-0">
      {requirements.map((req, index) => (
        <li key={index}>
          <RequirementItem requirement={req} depth={depth} />
        </li>
      ))}
    </ul>
  );
}
