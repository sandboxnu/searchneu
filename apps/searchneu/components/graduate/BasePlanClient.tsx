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
  Whiteboard,
} from "@/lib/graduate/types";
import {
  assignDndIds,
  stripDndIds,
  courseContainers,
  CourseContainer,
  isSidebarCourse,
  collisionAlgorithm,
  nextId,
  DELETE_ZONE_ID,
  addYear,
  deleteYear,
  removeCourse,
} from "@/lib/graduate/planUtils";
import { pruneWhiteboard } from "@/lib/graduate/requirementUtils";
import { applyCourseDetails } from "@/lib/graduate/auditUtils";
import { CourseNameContext } from "./CourseNameContext";
import { CourseDetailsContext } from "./CourseDetailsContext";
import type { CourseDetails } from "@/lib/graduate/types";
import { Sidebar } from "./sidebar/Sidebar";
import { AuditYearRow } from "./dnd/AuditYearRow";
import { AuditOverridesRow } from "./dnd/AuditOverridesRow";
import { CourseCardOverlay } from "./dnd/AuditCourseCard";
// TODO: restore when whiteboard mode ships after release
// import { WhiteboardSidebar } from "./sidebar/WhiteboardSidebar";
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
  // TODO: restore when whiteboard mode ships after release
  // onPersistWhiteboard,
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
  const [overridesExpanded, setOverridesExpanded] = useState(false);
  // TODO: restore when whiteboard mode ships after release (see sidebar toggle below)
  // const [sidebarMode, setSidebarMode] = useState<"whiteboard" | "requirements">(
  //   "whiteboard",
  // );

  function persist(updated: Audit) {
    const withIds = assignDndIds(updated);
    setSchedule(withIds);

    const pruned = pruneWhiteboard(updated, whiteboard);
    if (pruned) {
      setWhiteboard(pruned);
    }

    onPersistSchedule(stripDndIds(updated), pruned);
  }

  // TODO: restore when whiteboard mode ships after release
  // function persistWhiteboard(updated: Whiteboard) {
  //   setWhiteboard(updated);
  //   onPersistWhiteboard(updated);
  // }

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
      // terms + the overrides list; mutate classes in place so immer sees it
      const containers = courseContainers(draft);
      const target = containers.find((t) => t.id === over.id);
      const removeFrom = (container: CourseContainer) => {
        const index = container.classes.findIndex((c) => c.id === active.id);
        if (index !== -1) container.classes.splice(index, 1);
      };

      if (over.id === DELETE_ZONE_ID) {
        // Delete: remove from source
        const source = containers.find((t) =>
          t.classes.some((c) => c.id === active.id),
        );
        if (source) removeFrom(source);
        return;
      }

      if (!target) return;

      const fromSidebar = isSidebarCourse(active.id as string);
      const source = fromSidebar
        ? null
        : containers.find((t) => t.classes.some((c) => c.id === active.id));

      // No-op: dropped on same term
      if (!fromSidebar && source && source.id === target.id) return;

      // Duplicate check (skip for generic courses)
      if (
        !course.generic &&
        target.classes.some(
          (c) => c.classId === course.classId && c.subject === course.subject,
        )
      ) {
        toast.error(`${course.subject}${course.classId} is already there.`);
        return;
      }

      // Remove from source (if not from sidebar)
      if (source) removeFrom(source);

      // Add to target. Sidebar courses only carry a subject and classId,
      // so look up their real credits and NUPaths before saving.
      const details = courseDetails[`${course.subject}-${course.classId}`];
      target.classes.push({
        ...applyCourseDetails(course, details),
        id: `moving-${nextId()}`,
      });
    });

    if (updated !== schedule) {
      persist(updated);
    }
  }

  function handleAddCourses(
    yearNum: number,
    season: SeasonEnum,
    courses: AuditCourse[],
  ) {
    let skipped = 0;
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
      if (!term) return;
      for (const course of courses) {
        if (
          !course.generic &&
          term.classes.some(
            (c) => c.classId === course.classId && c.subject === course.subject,
          )
        ) {
          skipped++;
          continue;
        }
        term.classes.push({ ...course, id: null });
      }
    });
    if (skipped > 0) {
      toast.warning(
        `${skipped} course${skipped !== 1 ? "s were" : " was"} already in this term.`,
      );
    }
    persist(updated);
  }

  function handleRemoveCourse(
    yearNum: number,
    season: SeasonEnum,
    courseIndex: number,
  ) {
    persist(removeCourse(schedule, yearNum, season, courseIndex));
  }

  function handleAddOverrides(courses: AuditCourse[]) {
    let skipped = 0;
    const updated = produce(schedule, (draft) => {
      draft.overrides ??= [];
      for (const course of courses) {
        if (
          draft.overrides.some(
            (c) => c.classId === course.classId && c.subject === course.subject,
          )
        ) {
          skipped++;
          continue;
        }
        draft.overrides.push({ ...course, id: null });
      }
    });
    if (skipped > 0) {
      toast.warning(
        `${skipped} course${skipped !== 1 ? "s were" : " was"} already overridden.`,
      );
    }
    persist(updated);
  }

  function handleRemoveOverride(courseIndex: number) {
    persist(
      produce(schedule, (draft) => {
        draft.overrides?.splice(courseIndex, 1);
      }),
    );
  }

  function handleDeleteYear(yearNum: number) {
    const updated = deleteYear(schedule, yearNum);
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
    const { schedule: updated, addedYear } = addYear(schedule);
    setExpandedYears((prev) => new Set([...prev, addedYear]));
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
              <div className="bg-neu25 flex min-h-0 w-[360px] flex-shrink-0 flex-col">
                {/* TODO: restore the Requirements/Whiteboard toggle when whiteboard
                    mode ships after release */}
                {/* <div className="flex justify-center gap-1 px-4 pt-2">
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
                ) : ( */}
                <Sidebar
                  schedule={schedule}
                  majors={majors}
                  minors={minors}
                  concentration={concentration}
                />
                {/* )} */}
              </div>

              <div className="flex flex-grow flex-col overflow-auto pl-2">
                <div className="flex flex-col gap-[4px]">
                  {schedule.years.map((year) => (
                    <AuditYearRow
                      key={year.year}
                      year={year}
                      majors={majors}
                      minors={minors}
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
                      onAddCourses={(season, courses) =>
                        handleAddCourses(year.year, season, courses)
                      }
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
                <div className="mt-[10px] pb-[10px]">
                  <AuditOverridesRow
                    courses={schedule.overrides ?? []}
                    expanded={overridesExpanded}
                    majors={majors}
                    minors={minors}
                    onToggle={() => setOverridesExpanded((prev) => !prev)}
                    onRemoveCourse={handleRemoveOverride}
                    onAddCourses={handleAddOverrides}
                  />
                </div>
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
