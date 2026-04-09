"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  useDroppable,
} from "@dnd-kit/core";
import { produce } from "immer";
import { toast } from "sonner";
import {
  Audit,
  AuditCourse,
  AuditTerm,
  HydratedAuditPlan,
  SeasonEnum,
  StatusEnum,
  Whiteboard,
} from "@/lib/graduate/types";
import { CourseNameContext } from "./CourseNameContext";
import { Sidebar } from "./sidebar/Sidebar";
import { AuditYearRow } from "./dnd/AuditYearRow";
import { CourseCardOverlay } from "./dnd/AuditCourseCard";
import { WhiteboardSidebar } from "./sidebar/WhiteboardSidebar";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";
import {
  useGraduateMajor,
  useGraduateMinor,
} from "@/lib/graduate/useGraduateApi";

// ── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_COURSE_PREFIX = "sidebar-";
const DELETE_ZONE_ID = "delete-zone";

// ── Utilities ────────────────────────────────────────────────────────────────

let _idCounter = 0;

function assignDndIds(schedule: Audit): Audit {
  return {
    years: (schedule.years ?? []).map((year) => ({
      ...year,
      fall: assignTermIds(year.fall, year.year),
      spring: assignTermIds(year.spring, year.year),
      summer1: assignTermIds(year.summer1, year.year),
      summer2: assignTermIds(year.summer2, year.year),
    })),
  };
}

function assignTermIds(term: AuditTerm, yearNum: number): AuditTerm {
  return {
    ...term,
    id: `${yearNum}-${term.season}`,
    classes: term.classes.map((c) => ({
      ...c,
      id: `${c.subject}-${c.classId}-${++_idCounter}`,
    })),
  };
}

function stripDndIds(schedule: Audit): Audit {
  return {
    years: schedule.years.map((year) => ({
      ...year,
      fall: stripTermIds(year.fall),
      spring: stripTermIds(year.spring),
      summer1: stripTermIds(year.summer1),
      summer2: stripTermIds(year.summer2),
    })),
  };
}

function stripTermIds(term: AuditTerm): AuditTerm {
  return {
    ...term,
    id: null,
    classes: term.classes.map((c) => ({ ...c, id: null })),
  };
}

function isSidebarCourse(id: string): boolean {
  return id.startsWith(SIDEBAR_COURSE_PREFIX);
}

function flatTerms(schedule: Audit): AuditTerm[] {
  const terms: AuditTerm[] = [];
  for (const y of schedule.years) {
    terms.push(y.fall, y.spring, y.summer1, y.summer2);
  }
  return terms;
}

const collisionAlgorithm: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

// ── Main Component ───────────────────────────────────────────────────────────
interface GuestPlanClientProps {
  initialCourseNames?: Record<string, string>;
}

export function GuestPlanClient({
  initialCourseNames = {},
}: GuestPlanClientProps) {
  const [guestPlan] = useLocalStorage<CreateAuditPlanInput | null>(
    "guest-plan",
    null,
  );

  const [schedule, setSchedule] = useState<Audit>(() =>
    assignDndIds(guestPlan?.schedule ?? { years: [] }),
  );
  const [whiteboard, setWhiteboard] = useState<Whiteboard>({});
  const [activeCourse, setActiveCourse] = useState<AuditCourse | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(),
  );
  const [sidebarMode, setSidebarMode] = useState<"whiteboard" | "requirements">(
    "whiteboard",
  );

  const { majorData } = useGraduateMajor(
    String(guestPlan?.catalogYear ?? null),
    guestPlan?.majors?.[0] ?? null,
  );

  const { minorData } = useGraduateMinor(
    String(guestPlan?.catalogYear ?? null),
    guestPlan?.minors?.[0] ?? null,
  );

  /** Collect all "SUBJECT CLASSID" keys present in a schedule. */
  function scheduleCourseKeys(audit: Audit): Set<string> {
    const keys = new Set<string>();
    for (const y of audit.years) {
      for (const t of [y.fall, y.spring, y.summer1, y.summer2]) {
        for (const c of t.classes) keys.add(`${c.subject} ${c.classId}`);
      }
    }
    return keys;
  }

  /** Remove whiteboard courses that no longer exist in the schedule. */
  function pruneWhiteboard(audit: Audit, wb: Whiteboard): Whiteboard | null {
    const valid = scheduleCourseKeys(audit);
    let changed = false;
    const pruned: Whiteboard = {};
    for (const [section, entry] of Object.entries(wb)) {
      const filtered = entry.courses.filter((k) => valid.has(k));
      if (filtered.length !== entry.courses.length) changed = true;
      pruned[section] = { ...entry, courses: filtered };
    }
    return changed ? pruned : null;
  }

  async function persist(updated: Audit) {
    const withIds = assignDndIds(updated);
    setSchedule(withIds);

    const pruned = pruneWhiteboard(updated, whiteboard);
    if (pruned) setWhiteboard(pruned);

    const current = JSON.parse(localStorage.getItem("guest-plan") ?? "{}");
    localStorage.setItem(
      "guest-plan",
      JSON.stringify({
        ...current,
        schedule: stripDndIds(updated),
        ...(pruned && { whiteboard: pruned }),
      }),
    );
  }

  async function persistWhiteboard(updated: Whiteboard) {
    setWhiteboard(updated);

    const current = JSON.parse(localStorage.getItem("guest-plan") ?? "{}");
    localStorage.setItem(
      "guest-plan",
      JSON.stringify({ ...current, whiteboard: updated }),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveCourse({
      ...active.data.current?.course,
      id: active.id as string,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCourse(null);

    if (!over) return;

    const course: AuditCourse | undefined = active.data.current?.course;
    if (!course) return;

    const updated = produce(schedule, (draft) => {
      const terms = flatTerms(draft);
      const targetTerm = terms.find((t) => t.id === over.id);

      if (over.id === DELETE_ZONE_ID) {
        // Delete: remove from source
        const sourceTerm = terms.find((t) =>
          t.classes.some((c) => c.id === active.id),
        );
        if (sourceTerm) {
          sourceTerm.classes = sourceTerm.classes.filter(
            (c) => c.id !== active.id,
          );
        }
        return;
      }

      if (!targetTerm) return;

      const fromSidebar = isSidebarCourse(active.id as string);
      const sourceTerm = fromSidebar
        ? null
        : terms.find((t) => t.classes.some((c) => c.id === active.id));

      // No-op: dropped on same term
      if (!fromSidebar && sourceTerm && sourceTerm.id === targetTerm.id) return;

      // Duplicate check (skip for generic courses)
      if (
        !course.generic &&
        targetTerm.classes.some(
          (c) => c.classId === course.classId && c.subject === course.subject,
        )
      ) {
        toast.error(
          `${course.subject}${course.classId} already exists in that term.`,
        );
        return;
      }

      // Remove from source term (if not from sidebar)
      if (sourceTerm) {
        sourceTerm.classes = sourceTerm.classes.filter(
          (c) => c.id !== active.id,
        );
      }

      // Add to target term
      targetTerm.classes.push({
        ...course,
        id: `moving-${++_idCounter}`,
      });
    });

    if (updated !== schedule) {
      persist(updated);
    }
  }

  function handleRemoveCourse(
    yearNum: number,
    season: SeasonEnum,
    courseIndex: number,
  ) {
    const updated = produce(schedule, (draft) => {
      const year = draft.years.find((y) => y.year === yearNum);
      if (!year) return;
      const termMap: Record<string, AuditTerm> = {
        [SeasonEnum.FL]: year.fall,
        [SeasonEnum.SP]: year.spring,
        [SeasonEnum.S1]: year.summer1,
        [SeasonEnum.S2]: year.summer2,
      };
      const term = termMap[season];
      if (term) {
        term.classes.splice(courseIndex, 1);
      }
    });
    persist(updated);
  }

  function handleDeleteYear(yearNum: number) {
    const updated = produce(schedule, (draft) => {
      const idx = yearNum - 1;
      if (idx >= draft.years.length) return;
      draft.years.splice(idx, 1);
      draft.years.forEach((y, i) => {
        y.year = i + 1;
      });
    });
    setExpandedYears((prev) => {
      const next = new Set<number>();
      for (let i = 1; i <= updated.years.length; i++) {
        if (i < yearNum && prev.has(i)) next.add(i);
        else if (i >= yearNum && prev.has(i + 1)) next.add(i);
      }
      return next;
    });
    persist(updated);
  }

  function handleAddYear() {
    const nextYear = schedule.years.length + 1;
    const emptyTerm = (season: SeasonEnum): AuditTerm => ({
      season,
      status: StatusEnum.CLASSES,
      classes: [],
      id: `${nextYear}-${season}`,
    });
    const updated = produce(schedule, (draft) => {
      draft.years.push({
        year: nextYear,
        fall: emptyTerm(SeasonEnum.FL),
        spring: emptyTerm(SeasonEnum.SP),
        summer1: emptyTerm(SeasonEnum.S1),
        summer2: emptyTerm(SeasonEnum.S2),
        isSummerFull: false,
      });
    });
    setExpandedYears((prev) => new Set([...prev, nextYear]));
    persist(updated);
  }

  return (
    <CourseNameContext.Provider value={initialCourseNames}>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={collisionAlgorithm}
      >
        <DeleteDropZone>
          <div className="flex h-full overflow-hidden">
            <div className="bg-neu25 w-[360px] flex-shrink-0 overflow-y-auto">
              <div className="flex justify-center gap-1 px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSidebarMode("requirements")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all ${
                    sidebarMode === "requirements"
                      ? "bg-navy text-white shadow-md"
                      : "bg-neu3 text-neu6 hover:bg-neu4"
                  }`}
                >
                  Requirements
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarMode("whiteboard")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all ${
                    sidebarMode === "whiteboard"
                      ? "bg-navy text-white shadow-md"
                      : "bg-neu3 text-neu6 hover:bg-neu4"
                  }`}
                >
                  Whiteboard
                </button>
              </div>
              {sidebarMode === "whiteboard" ? (
                <WhiteboardSidebar
                  schedule={schedule}
                  majors={majorData ? [majorData] : []}
                  minors={minorData ? [minorData] : []}
                  concentration={guestPlan?.concentration ?? null}
                  whiteboard={whiteboard}
                  onWhiteboardChange={persistWhiteboard}
                />
              ) : (
                <Sidebar
                  schedule={schedule}
                  majors={majorData ? [majorData] : []}
                  minors={minorData ? [minorData] : []}
                  concentration={guestPlan?.concentration ?? null}
                />
              )}
            </div>

            <div className="flex-grow overflow-auto pl-2">
              <div className="flex flex-col gap-0.5">
                {schedule.years.map((year) => (
                  <AuditYearRow
                    key={year.year}
                    year={year}
                    expanded={expandedYears.has(year.year)}
                    onToggle={() =>
                      setExpandedYears((prev) => {
                        const next = new Set(prev);
                        if (next.has(year.year)) next.delete(year.year);
                        else next.add(year.year);
                        return next;
                      })
                    }
                    onRemoveCourse={(season, i) =>
                      handleRemoveCourse(year.year, season, i)
                    }
                    onDeleteYear={() => handleDeleteYear(year.year)}
                  />
                ))}
              </div>
              <button
                className="border-blue/50 text-blue hover:bg-blue/10 mt-2 w-full rounded-lg border border-dashed px-4 py-2 text-sm font-medium transition-colors"
                onClick={handleAddYear}
              >
                + Add Year
              </button>
            </div>
          </div>
        </DeleteDropZone>

        <DragOverlay dropAnimation={null}>
          {activeCourse && <CourseCardOverlay course={activeCourse} />}
        </DragOverlay>
      </DndContext>
    </CourseNameContext.Provider>
  );
}

// ── Delete Drop Zone ─────────────────────────────────────────────────────────

function DeleteDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: DELETE_ZONE_ID });
  return (
    <div ref={setNodeRef} className="flex h-full flex-col overflow-hidden">
      {children}
    </div>
  );
}
