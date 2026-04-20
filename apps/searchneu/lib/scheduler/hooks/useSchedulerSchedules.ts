"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCourseColorMap } from "../courseColors";
import { parseCourseIdsFromParams, syncCourseIdsToUrl } from "../filterParams";
import {
  filterSchedules,
  type ScheduleFilters,
  type SectionWithCourse,
} from "../filters";
import { getScheduleKey } from "../scheduleKey";

interface UseSchedulerSchedulesArgs {
  filters: ScheduleFilters;
}

export function useSchedulerSchedules({ filters }: UseSchedulerSchedulesArgs) {
  const searchParams = useSearchParams();

  const [courseIds, setCourseIdsState] = useState<number[]>(() =>
    parseCourseIdsFromParams(searchParams),
  );
  const [schedules, setSchedules] = useState<SectionWithCourse[][]>([]);
  const [courseToSections, setCourseToSections] = useState<
    Map<number, SectionWithCourse[]>
  >(new Map());
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const initialLoadRef = useRef(false);
  const regenerateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const setCourseIds = useCallback((ids: number[]) => {
    setCourseIdsState(ids);
    syncCourseIdsToUrl(ids);
  }, []);

  const filteredSchedules = useMemo(
    () => filterSchedules(schedules, filters),
    [schedules, filters],
  );

  const colorMap = useMemo(() => getCourseColorMap(schedules), [schedules]);

  const currentScheduleKey =
    selectedScheduleKey ??
    (filteredSchedules.length > 0
      ? getScheduleKey(filteredSchedules[0])
      : null);

  const fetchSections = async (
    ids: number[],
  ): Promise<Map<number, SectionWithCourse[]>> => {
    const map = new Map<number, SectionWithCourse[]>();
    await Promise.all(
      ids.map(async (courseId) => {
        try {
          const res = await fetch(`/api/scheduler/sections/${courseId}`);
          if (res.ok) map.set(courseId, await res.json());
        } catch (error) {
          console.error(
            `Failed to fetch sections for course ${courseId}:`,
            error,
          );
        }
      }),
    );
    return map;
  };

  const callGenerateApi = async (
    ids: number[],
    numCourses: number,
    lockedCourseIds?: Set<number>,
  ): Promise<SectionWithCourse[][]> => {
    const locked = lockedCourseIds ? Array.from(lockedCourseIds) : [];
    const optional = ids.filter((id) => !locked.includes(id));

    const params = new URLSearchParams();
    if (locked.length > 0) params.append("lockedCourseIds", locked.join(","));
    if (optional.length > 0)
      params.append("optionalCourseIds", optional.join(","));
    params.append("numCourses", numCourses.toString());

    const res = await fetch(
      `/api/scheduler/generate-schedules?${params.toString()}`,
    );
    if (!res.ok) throw new Error(`Failed to generate schedules: ${res.status}`);
    return await res.json();
  };

  useEffect(() => {
    if (courseIds.length === 0 || initialLoadRef.current) return;
    initialLoadRef.current = true;

    const autoLoad = async () => {
      setIsLoading(true);
      try {
        const sections = await fetchSections(courseIds);
        setCourseToSections(sections);

        const newSchedules = await callGenerateApi(
          courseIds,
          filters.numCourses ?? 4,
          filters.lockedCourseIds,
        );
        setSchedules(newSchedules);
      } catch (error) {
        console.error("Error auto-loading schedules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    autoLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateForCourses = useCallback(
    async (ids: number[], numCourses: number) => {
      setCourseIds(ids);
      setIsLoading(true);
      try {
        const sections = await fetchSections(ids);
        setCourseToSections(sections);

        const newSchedules = await callGenerateApi(ids, numCourses);
        setSchedules(newSchedules);
      } catch (error) {
        console.error("Error generating schedules:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [setCourseIds],
  );

  const regenerateSchedules = useCallback(
    async (lockedCourseIds: Set<number>) => {
      if (courseToSections.size === 0) return;

      if (regenerateDebounceRef.current) {
        clearTimeout(regenerateDebounceRef.current);
      }

      regenerateDebounceRef.current = setTimeout(async () => {
        try {
          const allIds = Array.from(courseToSections.keys());
          const newSchedules = await callGenerateApi(
            allIds,
            filters.numCourses ?? 4,
            lockedCourseIds,
          );
          setSchedules(newSchedules);
        } catch (error) {
          console.error("Error regenerating schedules:", error);
        }
        regenerateDebounceRef.current = null;
      }, 500);
    },
    [courseToSections, filters.numCourses],
  );

  useEffect(() => {
    return () => {
      if (regenerateDebounceRef.current)
        clearTimeout(regenerateDebounceRef.current);
    };
  }, []);

  return {
    courseIds,
    setCourseIds,
    schedules,
    filteredSchedules,
    courseToSections,
    colorMap,
    currentScheduleKey,
    setSelectedScheduleKey,
    generateForCourses,
    regenerateSchedules,
    isLoading,
  };
}
