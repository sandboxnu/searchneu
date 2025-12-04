"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import type { SectionWithCourse } from "@/lib/scheduler/filters";
import { SectionRow } from "./SectionRow";
import { cn } from "@/lib/cn";

interface CourseColor {
  fill: string;
  stroke: string;
}

interface CourseBoxProps {
  sections: SectionWithCourse[];
  color?: CourseColor;
}

export function CourseBox({ sections, color }: CourseBoxProps) {
  const [open, setOpen] = useState(false);
  const [courseLocked, setCourseLocked] = useState(false);

  const courseId = sections[0] ? `${sections[0].courseSubject} ${sections[0].courseNumber}` : "";
  const courseName = sections[0] ? sections[0].courseName : "";

  return (
    <div className="mb-3">
      <div
        className={cn(
          "rounded-md px-3 py-2 flex items-start justify-between border",
          color?.fill ? `bg-[${color.fill}]` : "bg-transparent",
          color?.stroke ? `border-[${color.stroke}]` : "border-transparent"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => setCourseLocked((c) => !c)}
            aria-label={courseLocked ? "Unlock course" : "Lock course"}
            className="p-1 self-start"
          >
            {courseLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
          </button>
          <div className="mt-1 leading-tight">
            <div className="font-bold text-sm text-gray-900 mb-1">{courseId}</div>
            <div className="text-sm text-muted-foreground">{courseName}</div>
          </div>
        </div>
        <button onClick={() => setOpen((s) => !s)} aria-label={open ? "Collapse" : "Expand"} className="p-1">
          {open ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      {open && (
        <div className="rounded-md mt-2 overflow-hidden border-2" style={{ borderColor: `${color?.fill}` }}>
          {sections.map((s) => (
            <SectionRow key={s.crn} section={s} />
          ))}
        </div>)}
    </div>
  );
}
