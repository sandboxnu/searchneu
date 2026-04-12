"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Audit, Whiteboard } from "@/lib/graduate/types";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";
import {
  useGraduateMajor,
  useGraduateMinor,
} from "@/lib/graduate/useGraduateApi";
import { BasePlanClient } from "./BasePlanClient";

const COURSE_NAMES_KEY = "guest-plan-courseNames";

interface GuestPlanClientProps {
  initialCourseNames?: Record<string, string>;
}

export function GuestPlanClient({
  initialCourseNames = {},
}: GuestPlanClientProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [guestPlan, setGuestPlan] = useLocalStorage<
    (CreateAuditPlanInput & { whiteboard?: Whiteboard }) | null
  >("guest-plan", null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !guestPlan) {
      router.replace("/graduate");
    }
  }, [guestPlan, router, isMounted]);

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

  const catalogYearStr = guestPlan?.catalogYear
    ? String(guestPlan.catalogYear)
    : null;

  const { majorData } = useGraduateMajor(
    catalogYearStr,
    guestPlan?.majors?.[0] ?? null,
  );

  const { minorData } = useGraduateMinor(
    catalogYearStr,
    guestPlan?.minors?.[0] ?? null,
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

  if (!guestPlan) return null;

  return (
    <BasePlanClient
      initialSchedule={guestPlan.schedule ?? { years: [] }}
      initialWhiteboard={guestPlan.whiteboard ?? {}}
      majors={majorData ? [majorData] : []}
      minors={minorData ? [minorData] : []}
      concentration={guestPlan.concentration ?? null}
      courseNames={courseNames}
      onPersistSchedule={handlePersistSchedule}
      onPersistWhiteboard={handlePersistWhiteboard}
    />
  );
}
