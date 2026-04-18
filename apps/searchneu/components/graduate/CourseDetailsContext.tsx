"use client";

import { createContext, useContext } from "react";
import type { CourseDetails } from "@/lib/graduate/types";

/**
 * Maps "SUBJECT-CLASSID" → CourseDetails (credits, coreqs, prereqs).
 * Built server-side from the DAL, provided to all graduate components.
 */
export const CourseDetailsContext = createContext<
  Record<string, CourseDetails>
>({});

export function useCourseDetails(
  subject: string,
  classId: string | number,
): CourseDetails | undefined {
  const map = useContext(CourseDetailsContext);
  return map[`${subject}-${classId}`];
}
