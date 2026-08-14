"use client";

import { useCallback, useMemo } from "react";
import { Audit, Whiteboard, Major, Minor } from "@/lib/graduate/types";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";
import { BasePlanClient } from "./BasePlanClient";
import NewPlanModal from "./modal/NewPlanModal";

const COURSE_NAMES_KEY = "guest-plan-courseNames";

interface GuestPlanClientProps {
  initialCourseNames?: Record<string, string>;
  initialMajors?: Major[];
  initialMinors?: Minor[];
}

export function GuestPlanClient({
  initialCourseNames = {},
  initialMajors = [],
  initialMinors = [],
}: GuestPlanClientProps) {
  const [guestPlan, setGuestPlan] = useLocalStorage<
    (CreateAuditPlanInput & { whiteboard?: Whiteboard }) | null
  >("guest-plan", null);

  // Persist server-provided course names to localStorage; on subsequent
  // visits (no search params) fall back to the cached copy.
  const courseNames = useMemo(() => {
    const hasServerNames = Object.keys(initialCourseNames).length > 0;
    if (hasServerNames) {
      try {
        localStorage.setItem(
          COURSE_NAMES_KEY,
          JSON.stringify(initialCourseNames),
        );
      } catch {
        // quota exceeded — still use server names for this session
      }
      return initialCourseNames;
    }
    try {
      const cached = localStorage.getItem(COURSE_NAMES_KEY);
      return cached ? (JSON.parse(cached) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, [initialCourseNames]);

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
      initialSchedule={guestPlan.schedule ?? { years: [] }}
      initialWhiteboard={guestPlan.whiteboard ?? {}}
      majors={initialMajors}
      minors={initialMinors}
      concentration={guestPlan.concentration ?? null}
      courseNames={courseNames}
      courseDetails={{}}
      onPersistSchedule={handlePersistSchedule}
      onPersistWhiteboard={handlePersistWhiteboard}
    />
  );
}
