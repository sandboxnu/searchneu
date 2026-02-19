"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import { Sidebar } from "../../components/graduate/sidebar/Sidebar";
import { Plan } from "../../components/graduate/plan/Plan";
import {
  createEmptyPlan,
  addCourseToTerm,
  flattenScheduleToTerms,
} from "../../lib/graduate/planUtils";
import type { Plan as PlanType, PlanCourse } from "../../lib/graduate/types";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";
import {
  createAuditPlan,
  updateAuditPlan,
} from "../../lib/graduate/auditPlanApi";

const DEFAULT_CATALOG_YEAR = 2024;

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  return rectIntersection(args);
};

function DraggedCourseOverlay({ course }: { course: PlanCourse }) {
  return (
    <div className="rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-sm shadow-lg">
      <span className="font-semibold text-blue-900">
        {course.subject} {course.classId}
      </span>
      {course.name && course.name !== `${course.subject} ${course.classId}` && (
        <span className="ml-2 text-neutral-600">{course.name}</span>
      )}
    </div>
  );
}

const DEFAULT_PLAN_NAME = "My Plan";

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [selectedMajorName, setSelectedMajorName] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanType>(() => createEmptyPlan(4));
  const [planId, setPlanId] = useState<number | null>(null);
  const [activeCourse, setActiveCourse] = useState<PlanCourse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const { catalogYear, majorNames } = useMemo(() => {
    const supported = data?.supportedMajors ?? {};
    const yearKey =
      Object.keys(supported)[0] ?? String(DEFAULT_CATALOG_YEAR);
    const majorsForYear = supported[yearKey] ?? {};
    return {
      catalogYear: parseInt(yearKey, 10) || DEFAULT_CATALOG_YEAR,
      majorNames: Object.keys(majorsForYear),
    };
  }, [data]);

  const effectiveMajorName =
    selectedMajorName && majorNames.includes(selectedMajorName)
      ? selectedMajorName
      : majorNames[0] ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    const course = event.active.data.current?.course as PlanCourse | undefined;
    if (course) setActiveCourse(course);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCourse(null);
    setPlanError(null);
    const { active, over } = event;
    if (!over) return;
    const course = active.data.current?.course as PlanCourse | undefined;
    if (!course) return;
    const termIds = flattenScheduleToTerms(plan).map((t) => t.id);
    if (!termIds.includes(String(over.id))) return;

    const updatedPlan = addCourseToTerm(plan, String(over.id), course);
    setPlan(updatedPlan);

    try {
      if (planId !== null) {
        await updateAuditPlan(planId, { schedule: updatedPlan.schedule });
      } else {
        const created = await createAuditPlan({
          name: DEFAULT_PLAN_NAME,
          schedule: updatedPlan.schedule,
          catalogYear: catalogYear,
          majors: effectiveMajorName ? [effectiveMajorName] : undefined,
        });
        setPlanId(created.id);
      }
    } catch (err) {
      setPlanError(
        err instanceof Error ? err.message : "Failed to save plan",
      );
      setPlan(plan);
    }
  };

  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={collisionDetection}
    >
      <div className="flex h-screen w-full overflow-hidden bg-white">
        <aside className="h-full w-80 shrink-0 border-r border-neutral-200">
          <Sidebar
            catalogYear={catalogYear}
            majorName={effectiveMajorName}
            selectedPlan={{ id: "1", concentration: "Undecided" }}
            courseData={true}
          />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden bg-neutral-100">
          {planError && (
            <div className="shrink-0 bg-red-50 px-6 py-2 text-sm text-red-700">
              {planError}
            </div>
          )}
          <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center gap-4">
              <h1 className="text-2xl font-bold text-blue-900">Your Plan</h1>
              <div className="flex gap-2">
                {majorNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedMajorName(name)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                      effectiveMajorName === name
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            <Plan plan={plan} />
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCourse ? (
          <DraggedCourseOverlay course={activeCourse} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
