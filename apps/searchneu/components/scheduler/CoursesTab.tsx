"use client";

import { useMemo, useState } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { CourseBox } from "@/components/scheduler/CourseBox";
import { getCourseColorMap, getCourseKey } from "@/lib/scheduler/courseColors";

interface CoursesTabProps {
  filteredSchedules: SectionWithCourse[][];
  hiddenSections: Set<string>;
  onToggleHiddenSection: (crn: string) => void;
}

export function CoursesTab({
  filteredSchedules,
  hiddenSections,
  onToggleHiddenSection,
}: CoursesTabProps) {
  const colorMap = useMemo(
    () => getCourseColorMap(filteredSchedules),
    [filteredSchedules],
  );

  const courseEntries = useMemo(() => {
    if (!filteredSchedules || filteredSchedules.length === 0) return [];
    const courseMap = new Map<string, Map<string, SectionWithCourse>>();
    for (const schedule of filteredSchedules) {
      for (const section of schedule) {
        const courseKey = getCourseKey(section);
        if (!courseMap.has(courseKey)) courseMap.set(courseKey, new Map());
        const inner = courseMap.get(courseKey)!;
        if (!inner.has(section.crn)) inner.set(section.crn, section);
      }
    }
    return Array.from(courseMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [filteredSchedules]);

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      {courseEntries.map(([courseKey, sectionsMap]) => (
        <CourseBox
          key={courseKey}
          sections={Array.from(sectionsMap.values())}
          color={colorMap.get(courseKey)}
          open={expandedCourse === courseKey}
          onToggle={() =>
            setExpandedCourse((prev) => (prev === courseKey ? null : courseKey))
          }
          hiddenSections={hiddenSections}
          onToggleHiddenSection={onToggleHiddenSection}
        />
      ))}
    </div>
  );
}
