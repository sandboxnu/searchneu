"use client";

import { useDraggable } from "@dnd-kit/core";
import { forwardRef, useEffect, useState } from "react";
import {
  AuditCourse,
  AuditTerm,
  SeasonEnum,
} from "../../../lib/graduate/types"; // ADJUST THIS PATH
import { SyntheticListenerMap  } from "@dnd-kit/core/dist/hooks/utilities";
import { DraggableAttributes } from "@dnd-kit/core";
import {
  DELETE_COURSE_AREA_DND_ID,
  SIDEBAR_DND_ID_PREFIX,
} from "./planDndUtils"; // ADJUST THIS PATH

// ── Types ────────────────────────────────────────────────────────────────────

export interface INEUReqError {
  type: string;
  [key: string]: unknown;
}

export interface TermError {
  [key: string]: INEUReqError | undefined;
}

interface DraggableScheduleCourseProps {
  scheduleCourse: AuditCourse<string>;
  scheduleTerm?: AuditTerm<string>;
  coReqErr?: INEUReqError;
  preReqErr?: INEUReqError;
  isEditable?: boolean;
  isDisabled?: boolean;
  removeCourse?: (course: AuditCourse<unknown>) => void;
  setIsRemove?: (val: boolean) => void;
  onErrorClick?: (course: AuditCourse<unknown>, err: INEUReqError) => void;
}

interface DraggedScheduleCourseProps {
  activeCourse: AuditCourse<string>;
  isRemove: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSidebarCourse(id: string): boolean {
  return id.startsWith(SIDEBAR_DND_ID_PREFIX);
}

function courseToString(c: { subject: string; classId: string | number }): string {
  return `${c.subject}${c.classId}`;
}

function getTransformStyle(transform: { x: number; y: number } | null): string | undefined {
  if (!transform) return undefined;
  return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
}

// ── Draggable Course (static on page, can be picked up) ─────────────────────

export const DraggableScheduleCourse: React.FC<DraggableScheduleCourseProps> = ({
  scheduleCourse,
  scheduleTerm,
  removeCourse,
  preReqErr,
  coReqErr,
  isEditable = false,
  isDisabled = false,
  setIsRemove,
  onErrorClick,
}) => {
  const { setNodeRef, transform, listeners, attributes, isDragging, over } =
    useDraggable({
      id: scheduleCourse.id,
      data: { course: scheduleCourse },
      disabled: isDisabled,
    });

  useEffect(() => {
    if (setIsRemove) setIsRemove(over?.id === DELETE_COURSE_AREA_DND_ID);
  }, [over, setIsRemove]);

  return (
    <ScheduleCourse
      ref={setNodeRef}
      scheduleCourse={scheduleCourse}
      scheduleTerm={scheduleTerm}
      removeCourse={removeCourse}
      preReqErr={preReqErr}
      coReqErr={coReqErr}
      isEditable={isEditable}
      isDragging={isDragging}
      listeners={listeners}
      attributes={attributes}
      transform={getTransformStyle(transform)}
      isFromSidebar={isSidebarCourse(scheduleCourse.id)}
      isDraggable
      onErrorClick={onErrorClick}
    />
  );
};

// ── Drag Overlay (follows cursor while dragging) ────────────────────────────

export const DraggedScheduleCourse: React.FC<DraggedScheduleCourseProps> = ({
  activeCourse,
  isRemove,
}) => (
  <ScheduleCourse
    isOverlay
    scheduleCourse={activeCourse}
    isRemove={isRemove}
    isFromSidebar={isSidebarCourse(activeCourse.id)}
    isDraggable
  />
);

// ── Base Course (purely visual) ─────────────────────────────────────────────

interface ScheduleCourseProps {
  scheduleCourse: AuditCourse<unknown>;
  scheduleTerm?: AuditTerm<string>;
  removeCourse?: (course: AuditCourse<unknown>) => void;
  preReqErr?: INEUReqError;
  coReqErr?: INEUReqError;
  isEditable?: boolean;
  isDragging?: boolean;
  listeners?: SyntheticListenerMap | undefined;
  attributes?: DraggableAttributes;
  transform?: string;
  isOverlay?: boolean;
  isRemove?: boolean;
  isFromSidebar?: boolean;
  isDraggable?: boolean;
  onErrorClick?: (course: AuditCourse<unknown>, err: INEUReqError) => void;
}

const ScheduleCourse = forwardRef<HTMLDivElement, ScheduleCourseProps>(
  (
    {
      scheduleCourse,
      scheduleTerm,
      removeCourse,
      preReqErr,
      coReqErr,
      isEditable = false,
      isDragging = false,
      listeners,
      attributes,
      transform,
      isOverlay = false,
      isRemove = false,
      isFromSidebar = false,
      isDraggable = false,
      onErrorClick,
    },
    ref
  ) => {
    const [hovered, setHovered] = useState(false);
    const isValidRemove = isRemove && !isFromSidebar;
    const hasError = coReqErr !== undefined || preReqErr !== undefined;

    return (
      <div
        ref={ref}
        className={`
          relative flex items-stretch justify-between rounded-lg text-sm mb-1.5
          transition-transform duration-150 ease-out w-full
          ${isOverlay ? "bg-gray-200" : "bg-white"}
          ${isDragging && !isFromSidebar ? "invisible" : ""}
          ${isValidRemove ? "opacity-50" : "opacity-100"}
        `}
        style={{
          transform: hovered && isDraggable ? "scale(1.04)" : transform ?? "scale(1)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...attributes}
      >
        {/* Drag handle + course info */}
        <div
          className={`
            flex-grow flex items-center
            ${isDraggable ? "px-2 py-2 cursor-grab" : "px-3 py-2 cursor-default"}
            ${isOverlay ? "cursor-grabbing" : ""}
          `}
          {...listeners}
        >
          {isDraggable && (
            <svg className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="3" cy="2" r="1.5" />
              <circle cx="7" cy="2" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="7" cy="8" r="1.5" />
              <circle cx="3" cy="14" r="1.5" />
              <circle cx="7" cy="14" r="1.5" />
            </svg>
          )}
          <p className="leading-tight">
            <span className="font-bold mr-1">{courseToString(scheduleCourse)}</span>
            <span>{scheduleCourse.name}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center">
          {hasError && (
            <button
              className="p-1 text-red-500 hover:text-red-700"
              onClick={() => {
                const err = preReqErr ?? coReqErr;
                if (onErrorClick && err) onErrorClick(scheduleCourse, err);
              }}
              title="Prerequisite or corequisite warning"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {isEditable && hovered && removeCourse && (
            <button
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              onClick={() => removeCourse(scheduleCourse)}
              title="Remove course"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {isEditable && !hovered && <div className="w-8 h-8 flex-shrink-0" />}
        </div>

        {/* Delete overlay icon */}
        {isValidRemove && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

ScheduleCourse.displayName = "ScheduleCourse";
