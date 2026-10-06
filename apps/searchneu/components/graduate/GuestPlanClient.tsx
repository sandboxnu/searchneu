"use client";

import { useCallback, useMemo } from "react";
import {
  Audit,
  CourseDetails,
  Whiteboard,
  Major,
  Minor,
} from "@/lib/graduate/types";
import { applyScheduleCourseDetails } from "@/lib/graduate/auditUtils";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";
import { BasePlanClient } from "./BasePlanClient";
import NewPlanModal from "./modal/NewPlanModal";

const COURSE_NAMES_KEY = "guest-plan-courseNames";
const COURSE_DETAILS_KEY = "guest-plan-courseDetails";

/**
 * Persist server-provided data to localStorage; on subsequent visits (no
 * search params, so the server sends nothing) fall back to the cached copy.
 */
function cacheOrRestore<T extends object>(key: string, fromServer: T): T {
  if (Object.keys(fromServer).length > 0) {
    try {
      localStorage.setItem(key, JSON.stringify(fromServer));
    } catch {
      // quota exceeded — still use server data for this session
    }
    return fromServer;
  }
  try {
    const cached = localStorage.getItem(key);
    return cached ? (JSON.parse(cached) as T) : fromServer;
  } catch {
    return fromServer;
  }
}

interface GuestPlanClientProps {
  initialCourseNames?: Record<string, string>;
  initialCourseDetails?: Record<string, CourseDetails>;
  initialMajors?: Major[];
  initialMinors?: Minor[];
}

export function GuestPlanClient({
  initialCourseNames = {},
  initialCourseDetails = {},
  initialMajors = [],
  initialMinors = [],
}: GuestPlanClientProps) {
  const [guestPlan, setGuestPlan] = useLocalStorage<
    (CreateAuditPlanInput & { whiteboard?: Whiteboard }) | null
  >("guest-plan", null);

  const courseNames = useMemo(
    () => cacheOrRestore(COURSE_NAMES_KEY, initialCourseNames),
    [initialCourseNames],
  );
  const courseDetails = useMemo(
    () => cacheOrRestore(COURSE_DETAILS_KEY, initialCourseDetails),
    [initialCourseDetails],
  );

  const handlePersistSchedule = useCallback(
    (stripped: Audit, pruned: Whiteboard | null) => {
      const current = JSON.parse(localStorage.getItem("guest-plan") ?? "{}");
      setGuestPlan({
        ...current,
        schedule: stripped,
        ...(pruned && { whiteboard: pruned }),
      });
    },
    [setGuestPlan],
  );

  const handlePersistWhiteboard = useCallback(
    (updated: Whiteboard) => {
      const current = JSON.parse(localStorage.getItem("guest-plan") ?? "{}");
      setGuestPlan({ ...current, whiteboard: updated });
    },
    [setGuestPlan],
  );

  if (!guestPlan) return <NewPlanModal isGuest={true} />;

  return (
    <BasePlanClient
      initialSchedule={applyScheduleCourseDetails(
        guestPlan.schedule ?? { years: [] },
        courseDetails,
      )}
      initialWhiteboard={guestPlan.whiteboard ?? {}}
      majors={initialMajors}
      minors={initialMinors}
      concentration={guestPlan.concentration ?? null}
      courseNames={courseNames}
      courseDetails={courseDetails}
      onPersistSchedule={handlePersistSchedule}
      onPersistWhiteboard={handlePersistWhiteboard}
    />
  );
}
