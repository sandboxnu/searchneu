"use client";

import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core";
import { Audit, AuditCourse } from "../../../lib/graduate/types"; // ADJUST THIS PATH
import { PropsWithChildren, useState } from "react";
import {
  updatePlanOnDragEnd,
  DuplicateCourseError,
  DELETE_COURSE_AREA_DND_ID,
} from "./planDndUtils"; // ADJUST THIS PATH
import { DraggedScheduleCourse } from "./AuditCourse";
import { AuditPlan, CoReqWarnings, PreReqWarnings } from "./AuditPlan";

// ── Collision Algorithm ──────────────────────────────────────────────────────

const courseDndCollisionAlgorithm: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0
    ? pointerCollisions
    : rectIntersection(args);
};

// ── Types ────────────────────────────────────────────────────────────────────

interface PlanDndWrapperProps {
  plan: Audit<string>;
  catalogYear: number;
  preReqWarnings?: PreReqWarnings;
  coReqWarnings?: CoReqWarnings;

  /** Called when a drag-and-drop results in a plan update. Caller persists it. */
  onPlanUpdate: (updatedPlan: Audit<string>) => void;

  /** Called when a duplicate course drop is attempted. */
  onError?: (message: string) => void;

  /** Called after each successful drop so the caller can recompute warnings. */
  onWarningsRecompute?: (updatedPlan: Audit<string>) => void;

  /** Optional sidebar to render alongside the plan. */
  sidebar?: React.ReactNode;
}

// ── Delete Area (wraps the entire layout) ────────────────────────────────────

const DeleteDropZone: React.FC<PropsWithChildren> = ({ children }) => {
  const { setNodeRef } = useDroppable({ id: DELETE_COURSE_AREA_DND_ID });
  return (
    <div ref={setNodeRef} className="flex h-full flex-col overflow-hidden">
      {children}
    </div>
  );
};

// ── Main Wrapper ─────────────────────────────────────────────────────────────

export const PlanDndWrapper: React.FC<PlanDndWrapperProps> = ({
  plan,
  catalogYear,
  preReqWarnings,
  coReqWarnings,
  onPlanUpdate,
  onError,
  onWarningsRecompute,
  sidebar,
}) => {
  const [activeCourse, setActiveCourse] = useState<AuditCourse<string> | null>(
    null,
  );
  const [isRemove, setIsRemove] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveCourse({
      ...active.data.current?.course,
      id: active.id as string,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    let updatedPlan: Audit<string>;
    try {
      updatedPlan = updatePlanOnDragEnd(plan, active, over);
    } catch (err) {
      if (err instanceof DuplicateCourseError && onError) {
        onError(err.message);
      }
      return;
    }

    onWarningsRecompute?.(updatedPlan);
    onPlanUpdate(updatedPlan);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={courseDndCollisionAlgorithm}
    >
      <DeleteDropZone>
        <div className="flex h-full overflow-hidden">
          {sidebar && (
            <div className="w-[360px] flex-shrink-0 overflow-y-auto bg-gray-100">
              {sidebar}
            </div>
          )}

          <div className="flex-grow overflow-auto p-4">
            <AuditPlan
              plan={plan}
              catalogYear={catalogYear}
              preReqErr={preReqWarnings}
              coReqErr={coReqWarnings}
              mutatePlanWithUpdate={onPlanUpdate}
              setIsRemove={setIsRemove}
            />
          </div>
        </div>
      </DeleteDropZone>

      <DragOverlay dropAnimation={null}>
        {activeCourse ? (
          <DraggedScheduleCourse
            activeCourse={activeCourse}
            isRemove={isRemove}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
