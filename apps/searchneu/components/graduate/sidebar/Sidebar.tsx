"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import {
  Section,
  Requirement,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  IRequiredCourse,
  SidebarValidationStatus,
  Audit,
  Major,
  Minor,
} from "@/lib/graduate/types";
import {
  creditsInAudit,
  UNDECIDED_CONCENTRATION,
  courseToString,
} from "@/lib/graduate/auditUtils";
import { useCourseName } from "../CourseNameContext";

// ── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_COURSE_PREFIX = "sidebar-";

// ── DraggableCourseChip ──────────────────────────────────────────────────────

function DraggableCourseChip({
  subject,
  classId,
  dndId,
}: {
  subject: string;
  classId: number;
  dndId: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dndId,
    data: {
      course: {
        id: dndId,
        subject,
        classId: String(classId),
        name: `${subject} ${classId}`,
        numCreditsMin: 0,
        numCreditsMax: 0,
      },
    },
  });
  const name = useCourseName(subject, classId);

  return (
    <div
      ref={setNodeRef}
      className={`bg-neu1 mb-1.5 flex w-full cursor-grab items-center rounded-lg px-2 py-2 text-sm ${isDragging ? "invisible" : ""}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="text-neu5 mr-1.5 h-3 w-3 flex-shrink-0" />
      <p className="leading-tight">
        <span className="mr-1 font-bold">
          {subject}
          {classId}
        </span>
        <span>{name}</span>
      </p>
    </div>
  );
}

// ── RequirementItem (recursive) ──────────────────────────────────────────────

function RequirementItem({
  req,
  dndIdPrefix,
}: {
  req: Requirement;
  dndIdPrefix: string;
}) {
  const cls = "pl-1 pt-1";

  if (req.type === "COURSE") {
    const c = req as IRequiredCourse;
    const dndId = `${SIDEBAR_COURSE_PREFIX}${dndIdPrefix}-${c.subject}-${c.classId}`;
    return (
      <div className={cls}>
        <DraggableCourseChip
          subject={c.subject}
          classId={c.classId}
          dndId={dndId}
        />
      </div>
    );
  }

  if (req.type === "AND") {
    const r = req as IAndCourse;
    return (
      <div className={cls}>
        <p className="text-neu7 text-sm italic">
          Complete all of the following:
        </p>
        {r.courses.map((c, i) => (
          <RequirementItem
            key={i}
            req={c}
            dndIdPrefix={`${dndIdPrefix}-${i}`}
          />
        ))}
      </div>
    );
  }

  if (req.type === "OR") {
    const r = req as IOrCourse;
    return (
      <div className={cls}>
        <p className="text-neu7 text-sm italic">Complete 1 of the following:</p>
        {r.courses.map((c, i) => (
          <RequirementItem
            key={i}
            req={c}
            dndIdPrefix={`${dndIdPrefix}-${i}`}
          />
        ))}
      </div>
    );
  }

  if (req.type === "XOM") {
    const r = req as IXofManyCourse;
    return (
      <div className={cls}>
        <p className="text-neu7 text-sm italic">
          Complete {r.numCreditsMin} credits from the following:
        </p>
        {r.courses.map((c, i) => (
          <RequirementItem
            key={i}
            req={c}
            dndIdPrefix={`${dndIdPrefix}-${i}`}
          />
        ))}
      </div>
    );
  }

  if (req.type === "RANGE") {
    const r = req as ICourseRange;
    return (
      <div className={cls}>
        <p className="text-neu7 text-sm italic">
          Complete any course in range {r.subject}
          {r.idRangeStart} to {r.subject}
          {r.idRangeEnd}
          {r.exceptions.length > 0 && (
            <> except {r.exceptions.map(courseToString).join(", ")}</>
          )}
        </p>
      </div>
    );
  }

  if (req.type === "SECTION") {
    const s = req as Section;
    return (
      <div className={cls}>
        <SidebarSection section={s} defaultOpen={false} />
      </div>
    );
  }

  return null;
}

// ── SidebarSection ───────────────────────────────────────────────────────────

function SidebarSection({
  section,
  defaultOpen = false,
  dndIdPrefix,
}: {
  section: Section;
  validationStatus?: SidebarValidationStatus;
  defaultOpen?: boolean;
  dndIdPrefix?: string;
}) {
  const [opened, setOpened] = useState(defaultOpen);

  return (
    <div
      className="border-neu25 cursor-pointer border-t transition-[background-color] duration-[0.25s] ease-out select-none"
      onClick={() => setOpened(!opened)}
    >
      <div className="bg-neu2 hover:bg-neu25 active:bg-neu3 sticky top-0 z-10 m-0 flex flex-row items-start justify-between px-4 py-4 font-bold transition-[background-color,border-color,color] delay-100 duration-[0.25s] ease-out">
        <div className="flex h-full flex-row gap-2">
          <span className="text-navy mt-0 text-sm">{section.title}</span>
        </div>
        {opened ? (
          <ChevronUp className="text-navy h-5 w-5 shrink-0" />
        ) : (
          <ChevronDown className="text-navy h-5 w-5 shrink-0" />
        )}
      </div>

      {opened && (
        <div
          className="border-neu25 bg-neu25 cursor-default border-t pt-2.5 pr-5 pb-4 pl-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {section.minRequirementCount < section.requirements.length && (
            <p className="text-neu7 text-sm italic">
              Complete {section.minRequirementCount} of the following:
            </p>
          )}
          {section.requirements.map((requirement, index) => (
            <RequirementItem
              key={index}
              req={requirement}
              dndIdPrefix={
                dndIdPrefix ? `${dndIdPrefix}-r${index}` : `r${index}`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({
  schedule,
  majors,
  minors,
  concentration,
}: {
  schedule: Audit;
  majors: Major[];
  minors: Minor[];
  concentration: string | null;
}) {
  const currentMajor = majors?.[0] ?? null;
  const currentMinor = minors?.[0] ?? null;
  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");

  if (!schedule) {
    return (
      <SidebarContainer title="Failed to load major">
        <div className="px-4 py-8 text-center">
          <span className="text-neu6 text-xs">
            Schedule data is unavailable
          </span>
        </div>
      </SidebarContainer>
    );
  }

  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const creditsToTake = currentMajor?.totalCreditsRequired ?? 0;
  const creditsTaken = creditsInAudit(schedule);

  const sections =
    activeTab === "major"
      ? currentMajor?.requirementSections
      : (currentMinor?.requirementSections ?? []);

  return (
    <SidebarContainer
      title={currentMajor ? currentMajor.name : "No major"}
      subtitle={subtitle}
      creditsTaken={creditsTaken}
      creditsToTake={creditsToTake}
    >
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="bg-neu2 pt-3">
          <div className="border-neu25 flex gap-2 border-b-2 px-4">
            <button
              type="button"
              onClick={() => setActiveTab("major")}
              className={`flex-[0.4] rounded-t-lg px-1 py-1 text-xs font-bold uppercase transition-all ${
                activeTab === "major"
                  ? "bg-navy text-white shadow-md"
                  : "bg-neu3 text-neu6 hover:bg-neu4"
              }`}
            >
              MAJOR
            </button>
            {currentMinor && (
              <button
                type="button"
                onClick={() => setActiveTab("minor")}
                className={`flex-[0.4] rounded-t-lg px-1 py-1 text-xs font-bold uppercase transition-all ${
                  activeTab === "minor"
                    ? "bg-navy text-white shadow-md"
                    : "bg-neu3 text-neu6 hover:bg-neu4"
                }`}
              >
                MINOR
              </button>
            )}
          </div>

          <div className="m-0 w-full p-0">
            <div className="border-neu25 bg-blue/10 flex items-center justify-between border-b px-4 py-3">
              <div className="flex-1" />
              <h2 className="text-navy flex-1 text-center text-base font-semibold">
                {activeTab === "major"
                  ? currentMajor
                    ? currentMajor.name
                    : "No Major"
                  : (currentMinor?.name ?? "Minor")}
              </h2>
              <div className="flex-1" />
            </div>

            {activeTab === "minor" && currentMinor && (
              <h3 className="text-navy px-4 py-4 text-base font-semibold">
                Minor Requirements
              </h3>
            )}

            {sections?.map((section: Section, index: number) => (
              <SidebarSection
                key={index}
                section={section}
                defaultOpen={index === 0}
                dndIdPrefix={`s${index}`}
              />
            ))}

            {!sections && (
              <p className="text-neu6 px-4 py-3 text-sm italic">
                No requirement sections
              </p>
            )}
          </div>
        </div>
      </div>
    </SidebarContainer>
  );
}

// ── SidebarContainer ─────────────────────────────────────────────────────────

function SidebarContainer({
  title,
  subtitle,
  creditsTaken,
  creditsToTake,
  children,
}: {
  title: string;
  subtitle?: string;
  creditsTaken?: number;
  creditsToTake?: number;
  children?: React.ReactNode;
}) {
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;

  return (
    <div className="border-neu25 flex h-full flex-col overflow-hidden border-r">
      <div className="shrink-0 px-4 pt-8 pb-4">
        <div className="pb-2">
          <h1 className="text-navy text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p
              className={`text-sm ${isUndecided ? "text-red italic" : "text-navy"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {creditsTaken !== undefined && (
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-navy text-2xl font-bold">
              {creditsTaken}
              {creditsToTake !== undefined ? `/${creditsToTake}` : ""}
            </span>
            <span className="text-navy">Credits Completed</span>
          </div>
        )}
      </div>
      <div className="[&::-webkit-scrollbar-thumb]:bg-neu4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  );
}
