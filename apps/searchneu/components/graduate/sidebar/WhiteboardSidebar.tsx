"use client";

import {
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Check,
  Minus,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Audit,
  AuditCourse,
  Whiteboard,
  WhiteboardEntry,
  WhiteboardStatus,
  Section,
  Requirement,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  IRequiredCourse,
  Major,
  Minor,
} from "@/lib/graduate/types";
import {
  creditsInAudit,
  UNDECIDED_CONCENTRATION,
  courseToString,
} from "@/lib/graduate/auditUtils";
import { useCourseName } from "../CourseNameContext";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// ── Helpers ──────────────────────────────────────────────────────────────────

function collectScheduleCourses(schedule: Audit): AuditCourse[] {
  const seen = new Set<string>();
  const courses: AuditCourse[] = [];
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes) {
        const key = `${c.subject} ${c.classId}`;
        if (!seen.has(key)) {
          seen.add(key);
          courses.push(c);
        }
      }
    }
  }
  return courses;
}

/** Recursively collects all COURSE-type requirement keys from a requirement tree. */
function collectRequiredCourseKeys(req: Requirement): string[] {
  if (req.type === "COURSE") {
    return [`${req.subject} ${req.classId}`];
  }
  if (
    req.type === "AND" ||
    req.type === "OR" ||
    req.type === "XOM" ||
    req.type === "SECTION"
  ) {
    const children =
      req.type === "SECTION"
        ? (req as Section).requirements
        : (req as IAndCourse | IOrCourse | IXofManyCourse).courses;
    return (children as Requirement[]).flatMap(collectRequiredCourseKeys);
  }
  return [];
}

/**
 * Builds a whiteboard by matching schedule courses against each section's
 * requirements. Existing manually-added courses are preserved.
 */
function buildAutoFilledWhiteboard(
  sections: Section[],
  scheduleCourses: AuditCourse[],
  current: Whiteboard,
): Whiteboard {
  const scheduleCourseKeys = new Set(
    scheduleCourses.map((c) => `${c.subject} ${c.classId}`),
  );
  const updated: Whiteboard = { ...current };
  for (const section of sections) {
    const sectionCourseKeys = new Set<string>();
    for (const req of section.requirements) {
      for (const key of collectRequiredCourseKeys(req)) {
        sectionCourseKeys.add(key);
      }
    }
    const matched = [...sectionCourseKeys].filter((k) =>
      scheduleCourseKeys.has(k),
    );
    // Merge: keep existing courses, add newly matched ones
    const existing = current[section.title]?.courses ?? [];
    const merged = [...new Set([...existing, ...matched])];
    updated[section.title] = {
      courses: merged,
      status:
        merged.length > 0
          ? (current[section.title]?.status ?? "in_progress") === "not_started"
            ? "in_progress"
            : (current[section.title]?.status ?? "in_progress")
          : (current[section.title]?.status ?? "not_started"),
    };
  }
  return updated;
}

const STATUS_CONFIG: Record<
  WhiteboardStatus,
  { label: string; border: string; bg: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    border: "border-green",
    bg: "bg-green",
    icon: <Check className="h-2.5 w-2.5" strokeWidth={3} />,
  },
  in_progress: {
    label: "In Progress",
    border: "border-yellow-500",
    bg: "bg-yellow-500",
    icon: <Minus className="h-2.5 w-2.5" strokeWidth={3} />,
  },
  not_started: {
    label: "Not Started",
    border: "border-neu5",
    bg: "bg-neu5",
    icon: <X className="h-2.5 w-2.5" strokeWidth={3} />,
  },
};

const STATUS_CYCLE: WhiteboardStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

// ── RequirementItem (recursive, from original Sidebar) ──────────────────────

function CourseName({
  subject,
  classId,
  planCourses,
  assignedCourses,
  onAddCourse,
}: {
  subject: string;
  classId: number;
  planCourses?: Set<string>;
  assignedCourses?: Set<string>;
  onAddCourse?: (courseKey: string) => void;
}) {
  const name = useCourseName(subject, classId);
  const key = `${subject} ${classId}`;
  const inPlan = planCourses?.has(key) ?? false;
  const isAssigned = assignedCourses?.has(key) ?? false;

  // Green when the course is both in plan AND assigned to this section
  if (isAssigned) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onAddCourse?.(key);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onAddCourse?.(key);
          }
        }}
        className="hover:bg-green/10 cursor-pointer rounded px-0.5 transition-colors"
      >
        <span className="text-green font-bold">
          {subject}&nbsp;{classId}
        </span>
        {name && <span className="text-neu6"> {name}</span>}
      </span>
    );
  }

  // Blue when the course is in the plan but not yet assigned to this section
  if (inPlan && onAddCourse) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onAddCourse(key);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onAddCourse(key);
          }
        }}
        className="hover:bg-blue/10 cursor-pointer rounded px-0.5 transition-colors"
      >
        <span className="text-blue font-bold">
          {subject}&nbsp;{classId}
        </span>
        {name && <span className="text-neu6"> {name}</span>}
      </span>
    );
  }

  return (
    <>
      <span className="font-semibold">
        {subject}&nbsp;{classId}
      </span>
      {name && <span className="text-neu6"> {name}</span>}
    </>
  );
}

interface RequirementItemProps {
  req: Requirement;
  planCourses?: Set<string>;
  assignedCourses?: Set<string>;
  onAddCourse?: (courseKey: string) => void;
}

function RequirementItem({
  req,
  planCourses,
  assignedCourses,
  onAddCourse,
}: RequirementItemProps) {
  const cls = "pl-1 pt-1";
  const childProps = { planCourses, assignedCourses, onAddCourse };

  if (req.type === "COURSE") {
    const c = req as IRequiredCourse;
    return (
      <div className={cls}>
        <p className="text-sm leading-tight">
          <CourseName subject={c.subject} classId={c.classId} {...childProps} />
        </p>
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
          <RequirementItem key={i} req={c} {...childProps} />
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
          <RequirementItem key={i} req={c} {...childProps} />
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
          <RequirementItem key={i} req={c} {...childProps} />
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
        <p className="text-neu7 text-xs font-medium uppercase">{s.title}</p>
        {s.requirements.map((r, i) => (
          <RequirementItem key={i} req={r} {...childProps} />
        ))}
      </div>
    );
  }

  return null;
}

// ── CourseBadge ──────────────────────────────────────────────────────────────

function CourseBadge({
  courseKey,
  onRemove,
}: {
  courseKey: string;
  onRemove: () => void;
}) {
  const [subject, classId] = courseKey.split(" ");
  const name = useCourseName(subject, Number(classId));
  return (
    <Badge variant="secondary" className="gap-1 py-1">
      <span className="font-semibold">
        {subject} {classId}
      </span>
      {name && <span className="text-neu6 max-w-[120px] truncate">{name}</span>}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-neu5 hover:text-neu8 ml-0.5 shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// ── CoursePickerItem ─────────────────────────────────────────────────────────

function CoursePickerItem({
  course,
  selected,
  onToggle,
}: {
  course: AuditCourse;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = useCourseName(course.subject, Number(course.classId));
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
        selected ? "bg-blue/10 text-navy" : "hover:bg-neu25"
      }`}
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected ? "border-blue bg-blue text-white" : "border-neu4"
        }`}
      >
        {selected && <Check className="h-2.5 w-2.5" />}
      </div>
      <span className="truncate">
        <span className="font-semibold">
          {course.subject} {course.classId}
        </span>
        {name && <span className="text-neu6"> {name}</span>}
      </span>
    </button>
  );
}

// ── WhiteboardSection ────────────────────────────────────────────────────────

function WhiteboardSection({
  section,
  entry,
  scheduleCourses,
  onUpdate,
  defaultOpen,
  planCourses,
}: {
  section: Section;
  entry: WhiteboardEntry;
  scheduleCourses: AuditCourse[];
  onUpdate: (entry: WhiteboardEntry) => void;
  defaultOpen: boolean;
  planCourses: Set<string>;
}) {
  const [opened, setOpened] = useState(defaultOpen);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const assignedSet = new Set(entry.courses);
  const statusCfg = STATUS_CONFIG[entry.status];

  const filteredCourses = scheduleCourses.filter((c) => {
    const label = `${c.subject} ${c.classId} ${c.name}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(entry.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onUpdate({ ...entry, status: next });
  }

  function toggleCourse(courseKey: string) {
    const courses = assignedSet.has(courseKey)
      ? entry.courses.filter((k) => k !== courseKey)
      : [...entry.courses, courseKey];
    onUpdate({ ...entry, courses });
  }

  function removeCourse(courseKey: string) {
    onUpdate({
      ...entry,
      courses: entry.courses.filter((k) => k !== courseKey),
    });
  }

  return (
    <div
      className="border-neu25 cursor-pointer border-t transition-[background-color] duration-[0.25s] ease-out select-none"
      onClick={() => setOpened(!opened)}
    >
      {/* Section header — matches original Sidebar styling */}
      <div className="bg-neu2 hover:bg-neu25 active:bg-neu3 sticky top-0 z-10 m-0 flex flex-row items-start justify-between px-4 py-4 font-bold transition-[background-color,border-color,color] delay-100 duration-[0.25s] ease-out">
        <div className="flex h-full flex-row gap-2">
          <button
            type="button"
            onClick={cycleStatus}
            title={`Status: ${statusCfg.label} (click to change)`}
            className={`mt-0.5 flex h-[18px] min-h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded-full border text-white transition-[background-color,border-color,color] duration-[0.25s] ease-out ${statusCfg.border} ${statusCfg.bg}`}
          >
            {statusCfg.icon}
          </button>
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
          {/* Requirement info from the major */}
          {section.minRequirementCount < section.requirements.length && (
            <p className="text-neu7 text-sm italic">
              Complete {section.minRequirementCount} of the following:
            </p>
          )}
          {section.requirements.map((requirement, index) => (
            <RequirementItem
              key={index}
              req={requirement}
              planCourses={planCourses}
              assignedCourses={assignedSet}
              onAddCourse={toggleCourse}
            />
          ))}

          {/* Add courses button + popover (pinned at top for stable position) */}
          <div className="mb-3 pl-1">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-blue hover:bg-blue/10 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add courses
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0">
                <div className="border-neu25 border-b p-2">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-neu1 border-neu3 focus:border-blue w-full rounded border px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filteredCourses.length === 0 ? (
                    <p className="text-neu6 px-2 py-3 text-center text-xs">
                      No courses found
                    </p>
                  ) : (
                    filteredCourses.map((c) => {
                      const key = `${c.subject} ${c.classId}`;
                      return (
                        <CoursePickerItem
                          key={key}
                          course={c}
                          selected={assignedSet.has(key)}
                          onToggle={() => toggleCourse(key)}
                        />
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Assigned courses */}
          {entry.courses.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1 pl-1">
              {entry.courses.map((key) => (
                <CourseBadge
                  key={key}
                  courseKey={key}
                  onRemove={() => removeCourse(key)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main WhiteboardSidebar ───────────────────────────────────────────────────

export function WhiteboardSidebar({
  schedule,
  majors,
  minors,
  concentration,
  whiteboard,
  onWhiteboardChange,
}: {
  schedule: Audit;
  majors: Major[];
  minors: Minor[];
  concentration: string | null;
  whiteboard: Whiteboard;
  onWhiteboardChange: (updated: Whiteboard) => void;
}) {
  const currentMajor = majors?.[0] ?? null;
  const currentMinor = minors?.[0] ?? null;
  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");
  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const creditsToTake = currentMajor?.totalCreditsRequired ?? 0;
  const creditsTaken = creditsInAudit(schedule);
  const scheduleCourses = collectScheduleCourses(schedule);
  // Set of all courses in the user's plan/schedule
  const planCourses = useMemo(
    () => new Set(scheduleCourses.map((c) => `${c.subject} ${c.classId}`)),
    [scheduleCourses],
  );

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

  const sections =
    activeTab === "major"
      ? currentMajor?.requirementSections
      : (currentMinor?.requirementSections ?? []);

  const defaultEntry: WhiteboardEntry = {
    courses: [],
    status: "not_started",
  };

  function handleSectionUpdate(sectionTitle: string, entry: WhiteboardEntry) {
    onWhiteboardChange({ ...whiteboard, [sectionTitle]: entry });
  }

  function handleAutoFill() {
    const allSections = [
      ...(currentMajor?.requirementSections ?? []),
      ...(currentMinor?.requirementSections ?? []),
    ];
    const updated = buildAutoFilledWhiteboard(
      allSections,
      scheduleCourses,
      whiteboard,
    );
    onWhiteboardChange(updated);
  }

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

            <div className="border-neu25 border-b px-4 py-3">
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-blue hover:bg-blue/10 flex w-full items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto-fill from schedule
              </button>
              <p className="text-neu6 mt-1 text-center text-xs">
                Automatically assigns schedule courses to matching sections.
              </p>
            </div>

            {activeTab === "minor" && currentMinor && (
              <h3 className="text-navy px-4 py-4 text-base font-semibold">
                Minor Requirements
              </h3>
            )}

            {sections?.map((section: Section, index: number) => (
              <WhiteboardSection
                key={`${section.title}-${index}`}
                section={section}
                entry={whiteboard[section.title] ?? defaultEntry}
                scheduleCourses={scheduleCourses}
                onUpdate={(entry) => handleSectionUpdate(section.title, entry)}
                defaultOpen={index === 0}
                planCourses={planCourses}
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

// ── SidebarContainer (matches original Sidebar) ─────────────────────────────

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
