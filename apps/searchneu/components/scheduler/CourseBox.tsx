"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import type { SectionWithCourse } from "@/lib/scheduler/filters";
import { SectionRow } from "./SectionRow";
import { type CourseColor } from "@/lib/scheduler/courseColors";

interface CourseBoxProps {
  sections: SectionWithCourse[];
  color?: CourseColor;
  open: boolean;
  onToggle: () => void;
  hiddenSections: Set<string>;
  onToggleHiddenSection: (crn: string) => void;
}

export function CourseBox({
  sections,
  color,
  open,
  onToggle,
  hiddenSections,
  onToggleHiddenSection,
}: CourseBoxProps) {
  const [locked, setLocked] = useState(false);

  const courseId = sections[0]
    ? `${sections[0].courseSubject} ${sections[0].courseNumber}`
    : "";
  const courseName = sections[0] ? sections[0].courseName : "";

  return (
    <div
      className={`group flex min-h-0 overflow-clip rounded-lg pl-1 py-1 ${open ? "flex-1" : "shrink-0"}`}
      style={{
        backgroundColor: color?.fill,
        border: open ? `1px solid ${color?.accent}66` : "1px solid transparent",
      }}
    >
      {/* Left accent pill */}
      <div className="flex items-center py-0.5">
        <div
          className="h-full w-1 rounded-full"
          style={{ backgroundColor: color?.accent }}
        />
      </div>

      {/* Content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Course header - always visible */}
        <button
          onClick={onToggle}
          className="flex w-full shrink-0 cursor-pointer items-center gap-1.5 px-3 py-1"
        >
          <span className="shrink-0 text-sm font-bold text-[#333]">
            {courseId}
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-sm text-[#858585]">
            {courseName}
          </span>
          <Lock
            className={`h-3.5 w-3.5 shrink-0 cursor-pointer transition-colors ${
              locked
                ? "block text-red-500"
                : "hidden text-[#a3a3a3] hover:text-[#666] group-hover:block"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setLocked((prev) => !prev);
            }}
          />
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#858585] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expanded sections - scrollable */}
        {open && (
          <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {sections.map((s) => (
              <SectionRow
                key={s.crn}
                section={s}
                hidden={hiddenSections.has(s.crn)}
                onToggleHidden={() => onToggleHiddenSection(s.crn)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
