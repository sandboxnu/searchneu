"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Plus, X, Check, Minus } from "lucide-react";
import {
  AuditCourse,
  WhiteboardEntry,
  WhiteboardStatus,
  Section,
  Requirement,
  IAndCourse,
  IOrCourse,
  IXofManyCourse,
  ICourseRange,
  IRequiredCourse,
} from "@/lib/graduate/types";
import { courseToString } from "@/lib/graduate/auditUtils";
import { useCourseName } from "../CourseNameContext";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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

export function WhiteboardSection({
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
