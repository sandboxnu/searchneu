"use client";

import { createContext, useContext } from "react";

/**
 * Maps "SUBJECT-CLASSID" → course name.
 * Built server-side from the DAL, provided to all graduate components.
 */
export const CourseNameContext = createContext<Record<string, string>>({});

export function useCourseName(
  subject: string,
  classId: string | number,
  fallbackName?: string,
): string {
  const map = useContext(CourseNameContext);
  return (
    map[`${subject}-${classId}`] ?? fallbackName ?? `${subject} ${classId}`
  );
}
