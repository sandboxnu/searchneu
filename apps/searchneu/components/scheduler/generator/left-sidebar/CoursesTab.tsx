"use client";

import { useMemo, useState } from "react";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { CourseBox } from "./CourseBox";
import { COURSE_COLORS, getCourseKey } from "@/lib/scheduler/courseColors";

interface CoursesTabProps {
  courseToSections: Map<number, SectionWithCourse[]>;
  hiddenSectionIds: Set<number>;
  onToggleHiddenSection: (sectionId: number) => void;
  lockedCourseIds: Set<number>;
  onLockedCourseIdsChange: (ids: Set<number>) => void;
}

export function CoursesTab({
  courseToSections,
  hiddenSectionIds,
  onToggleHiddenSection,
  lockedCourseIds,
  onLockedCourseIdsChange,
}: CoursesTabProps) {
  // Build sorted course entries with colors from the Map
  const courseEntries = useMemo(() => {
    const entries = Array.from(courseToSections.entries())
      .map(([courseId, sections]) => {
        const courseKey = sections[0]
          ? getCourseKey(sections[0])
          : String(courseId);
        return { courseId, courseKey, sections };
      })
      .sort((a, b) => a.courseKey.localeCompare(b.courseKey));

    const colorMap = new Map(
      entries.map((e, i) => [
        e.courseKey,
        COURSE_COLORS[i % COURSE_COLORS.length],
      ]),
    );

    return { entries, colorMap };
  }, [courseToSections]);

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-y-auto">
      {courseEntries.entries.map(({ courseId, courseKey, sections }) => {
        const isLocked = lockedCourseIds.has(courseId);

        return (
          <CourseBox
            key={courseKey}
            sections={sections}
            color={courseEntries.colorMap.get(courseKey)}
            open={expandedCourse === courseKey}
            onToggle={() =>
              setExpandedCourse((prev) =>
                prev === courseKey ? null : courseKey,
              )
            }
            hiddenSectionIds={hiddenSectionIds}
            onToggleHiddenSection={onToggleHiddenSection}
            locked={isLocked}
            onToggleLock={() => {
              const newLockedCourseIds = new Set(lockedCourseIds);
              if (isLocked) {
                newLockedCourseIds.delete(courseId);
              } else {
                newLockedCourseIds.add(courseId);
              }
              onLockedCourseIdsChange(newLockedCourseIds);
            }}
          />
        );
      })}
    </div>
  );
}
