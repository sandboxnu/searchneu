"use client";

import type { Campus, Nupath } from "@/lib/catalog/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleFilters, SectionWithCourse } from "../filters";
import type { PlanUpdateData } from "../types";

interface UsePlanPersistenceArgs {
  isLoggedIn: boolean;
  filters: ScheduleFilters;
  courseIds: number[];
  courseToSections: Map<number, SectionWithCourse[]>;
  campuses: Campus[];
  nupaths: Nupath[];
  onFavoritesLoaded: (favorites: Map<string, number>) => void;
}

export function usePlanPersistence({
  isLoggedIn,
  filters,
  courseIds,
  courseToSections,
  campuses,
  nupaths,
  onFavoritesLoaded,
}: UsePlanPersistenceArgs) {
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("planId");
  const termFromUrl = searchParams.get("term");

  const [planId, setPlanId] = useState<number | null>(
    planIdFromUrl ? parseInt(planIdFromUrl) : null,
  );
  const [planName, setPlanName] = useState("Plan");
  const resolvedRef = useRef(!!planIdFromUrl);

  const campusNameToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of campuses) m.set(c.name, c.id);
    return m;
  }, [campuses]);

  const nupathShortToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nupaths) m.set(n.short, n.id);
    return m;
  }, [nupaths]);

  useEffect(() => {
    if (!isLoggedIn || resolvedRef.current) return;
    if (courseIds.length === 0 || courseToSections.size === 0 || !termFromUrl)
      return;
    resolvedRef.current = true;

    (async () => {
      try {
        // Fallback: find matching plan by courseIds, or create new
        const res = await fetch(
          `/api/scheduler/saved-plans/term/${termFromUrl}`,
        );
        if (!res.ok) {
          console.error("Failed to fetch plans:", res.status);
          return;
        }

        const plans = await res.json();
        const sortedTarget = [...courseIds].sort((a, b) => a - b).join(",");
        const matched = plans.find(
          (p: { courses: { courseId: number }[] }) =>
            p.courses
              .map((c: { courseId: number }) => c.courseId)
              .sort((a: number, b: number) => a - b)
              .join(",") === sortedTarget,
        );

        if (matched) {
          setPlanId(matched.id);
          setPlanName(matched.name);
          addPlanIdToUrl(matched.id);

          const favMap = new Map<string, number>();
          for (const fav of matched.favoritedSchedules || []) {
            if (fav.sections) {
              const key = fav.sections
                .map((s: { sectionId: number }) => s.sectionId)
                .sort((a: number, b: number) => a - b)
                .join("|");
              favMap.set(key, fav.id);
            }
          }
          onFavoritesLoaded(favMap);
        } else {
          const courses = courseIds.map((courseId) => ({
            courseId,
            sections:
              courseToSections
                .get(courseId)
                ?.map((s) => ({ sectionId: s.id })) ?? [],
          }));

          const createRes = await fetch("/api/scheduler/saved-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              term: termFromUrl,
              courses,
              numCourses: filters.numCourses ?? 4,
            }),
          });

          if (createRes.ok) {
            const plan = await createRes.json();
            setPlanId(plan.id);
            setPlanName(plan.name ?? "Plan");
            addPlanIdToUrl(plan.id);
          }
        }
      } catch (error) {
        console.error("Error resolving plan:", error);
      }
    })();
  }, [isLoggedIn, termFromUrl, courseIds, courseToSections]);

  // planId is present in URL
  useEffect(() => {
    if (!isLoggedIn || !planIdFromUrl || !termFromUrl) return;

    (async () => {
      try {
        const res = await fetch(`/api/scheduler/saved-plans/${planIdFromUrl}`);
        if (!res.ok) return;
        const plan = await res.json();
        if (plan.name) setPlanName(plan.name);

        const favMap = new Map<string, number>();
        for (const fav of plan.favoritedSchedules || []) {
          if (fav.sections) {
            const key = fav.sections
              .map((s: { sectionId: number }) => s.sectionId)
              .sort((a: number, b: number) => a - b)
              .join("|");
            favMap.set(key, fav.id);
          }
        }
        onFavoritesLoaded(favMap);
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    })();
  }, [planIdFromUrl]);

  // Persist filter changes to DB
  useEffect(() => {
    if (!planId || !isLoggedIn) return;

    const timer = setTimeout(async () => {
      try {
        const updateData: PlanUpdateData = {
          startTime: filters.startTime ?? null,
          endTime: filters.endTime ?? null,
          freeDays: filters.specificDaysFree ?? [],
          includeHonorsSections: filters.includeHonors ?? false,
          includeRemoteSections: filters.includesRemote ?? true,
          hideFilledSections: (filters.minSeatsLeft ?? 0) > 0,
          nupaths:
            filters.nupaths
              ?.map((short) => nupathShortToId.get(short))
              .filter((id): id is number => id !== undefined) ?? [],
          numCourses: filters.numCourses,
          campus: filters.desiredCampus
            ? (campusNameToId.get(filters.desiredCampus) ?? null)
            : null,
          courses: Array.from(courseToSections.entries()).map(
            ([courseId, sections]) => ({
              courseId,
              isLocked: filters.lockedCourseIds?.has(courseId) ?? false,
              sections: sections.map((s) => ({
                sectionId: s.id,
                isHidden: filters.hiddenSectionIds?.has(s.id) ?? false,
              })),
            }),
          ),
        };

        await fetch(`/api/scheduler/saved-plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
      } catch (error) {
        console.error("Error updating plan:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, courseToSections, planId, isLoggedIn]);

  return { planId, planName };
}

function addPlanIdToUrl(id: number) {
  const params = new URLSearchParams(window.location.search);
  params.set("planId", String(id));
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${params.toString()}`,
  );
}
