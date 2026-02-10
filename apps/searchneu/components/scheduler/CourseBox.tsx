"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import type { SectionWithCourse } from "@/lib/scheduler/filters";
import { SectionRow } from "./SectionRow";
import { type CourseColor } from "@/lib/scheduler/courseColors";

interface CourseBoxProps {
  sections: SectionWithCourse[];
  color?: CourseColor;
}

export function CourseBox({ sections, color }: CourseBoxProps) {
  const [open, setOpen] = useState(false);
  const [courseLocked, setCourseLocked] = useState(false);

  const courseId = sections[0]
    ? `${sections[0].courseSubject} ${sections[0].courseNumber}`
    : "";
  const courseName = sections[0] ? sections[0].courseName : "";

  return (
    <div className="mb-3">
      <div
        className="flex items-start justify-between rounded-md border px-3 py-2"
        style={{
          borderColor: `${color?.stroke}`,
          backgroundColor: `${color?.fill}`,
        }}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => setCourseLocked((c) => !c)}
            aria-label={courseLocked ? "Unlock course" : "Lock course"}
            className="self-start p-1"
          >
            {courseLocked ? (
              <Lock className="h-4 w-4 text-red-500" />
            ) : (
              <Unlock className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <div className="mt-1 leading-tight">
            <div className="text-neu8 mb-1 text-sm font-bold">{courseId}</div>
            <div className="text-neu7 text-sm">{courseName}</div>
          </div>
        </div>
        <button
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? "Collapse" : "Expand"}
          className="p-1"
        >
          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {open && (
        <div
          className="mt-2 overflow-hidden rounded-md border"
          style={{ borderColor: `${color?.fill}` }}
        >
          {sections.map((s) => (
            <SectionRow key={s.crn} section={s} />
          ))}
        </div>
      )}
    </div>
  );
}
