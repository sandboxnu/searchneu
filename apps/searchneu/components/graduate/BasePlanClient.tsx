"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { produce } from "immer";
import { toast } from "sonner";
import {
  Audit,
  AuditCourse,
  AuditTerm,
  Major,
  Minor,
  SeasonEnum,
  StatusEnum,
  Whiteboard,
} from "@/lib/graduate/types";
import {
  assignDndIds,
  stripDndIds,
  flatTerms,
  isSidebarCourse,
  collisionAlgorithm,
  nextId,
  DELETE_ZONE_ID,
} from "@/lib/graduate/planUtils";
import { CourseNameContext } from "./CourseNameContext";
import { CourseDetailsContext } from "./CourseDetailsContext";
import type { CourseDetails } from "@/lib/graduate/types";
import { Sidebar } from "./sidebar/Sidebar";
import { AuditYearRow } from "./dnd/AuditYearRow";
import { CourseCardOverlay } from "./dnd/AuditCourseCard";
import { WhiteboardSidebar } from "./sidebar/WhiteboardSidebar";
import { Plus } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BasePlanClientProps {
  initialSchedule: Audit;
  initialWhiteboard: Whiteboard;
  majors: Major[];
  minors: Minor[];
  concentration: string | null;
  courseNames: Record<string, string>;
  courseDetails: Record<string, CourseDetails>;
  onPersistSchedule: (stripped: Audit, pruned: Whiteboard | null) => void;
  onPersistWhiteboard: (updated: Whiteboard) => void;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BasePlanClient({
  initialSchedule,
  initialWhiteboard,
  majors,
  minors,
  concentration,
  courseNames,
  courseDetails,
  onPersistSchedule,
  onPersistWhiteboard,
}: BasePlanClientProps) {
  const [schedule, setSchedule] = useState<Audit>(() =>
    assignDndIds(initialSchedule),
  );
  const [whiteboard, setWhiteboard] = useState<Whiteboard>(
    () => initialWhiteboard,
  );
  const [activeCourse, setActiveCourse] = useState<AuditCourse | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(),
  );
  const [sidebarMode, setSidebarMode] = useState<"whiteboard" | "requirements">(
    "whiteboard",
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

  function persist(updated: Audit) {
    const withIds = assignDndIds(updated);
    setSchedule(withIds);

    const pruned = pruneWhiteboard(updated, whiteboard);
    if (pruned) {
      setWhiteboard(pruned);
    }

    onPersistSchedule(stripDndIds(updated), pruned);
  }

  function persistWhiteboard(updated: Whiteboard) {
    setWhiteboard(updated);
    onPersistWhiteboard(updated);
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
        id: `moving-${nextId()}`,
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
    <CourseNameContext.Provider value={courseNames}>
      <CourseDetailsContext.Provider value={courseDetails}>
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={collisionAlgorithm}
        >
          <DeleteDropZone>
            <div className="flex min-h-0 flex-1 overflow-hidden">
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
                    majors={majors}
                    minors={minors}
                    concentration={concentration}
                    whiteboard={whiteboard}
                    onWhiteboardChange={persistWhiteboard}
                  />
                ) : (
                  <Sidebar
                    schedule={schedule}
                    majors={majors}
                    minors={minors}
                    concentration={concentration}
                  />
                )}
              </div>

              <div className="flex flex-grow flex-col overflow-auto pl-2">
                <div className="flex flex-col gap-[4px]">
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
                  className="border-neu4 bg-neu3 text-neu8 mt-[10px] flex flex-row justify-center gap-1 self-center rounded-[36px] border px-[16px] py-[8px] text-[14px] transition-colors"
                  onClick={handleAddYear}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Add Year
                </button>
              </div>
            </div>
          </DeleteDropZone>

          <DragOverlay dropAnimation={null}>
            {activeCourse && <CourseCardOverlay course={activeCourse} />}
          </DragOverlay>
        </DndContext>
      </CourseDetailsContext.Provider>
    </CourseNameContext.Provider>
  );
}

// ── Delete Drop Zone ─────────────────────────────────────────────────────────

function DeleteDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: DELETE_ZONE_ID });
  return (
    <div ref={setNodeRef} className="flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
