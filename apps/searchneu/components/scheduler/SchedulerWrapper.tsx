"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  filterSchedules,
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { getCourseColorMap } from "@/lib/scheduler/courseColors";
import { getScheduleKey } from "@/lib/scheduler/scheduleKey";
import { SchedulerView } from "./SchedulerView";
import { ScheduleSidebar } from "./ScheduleSidebar";
import { FilterPanel } from "./FilterPanel";
import { GroupedTerms } from "@/lib/types";
import {
  parseFiltersFromParams,
  syncToUrl,
} from "@/lib/scheduler/filterParams";

interface SchedulerWrapperProps {
  initialSchedules: SectionWithCourse[][];
  nupathOptions: { label: string; value: string }[];
  terms: GroupedTerms;
}

export function SchedulerWrapper({
  initialSchedules,
  nupathOptions,
  terms,
}: SchedulerWrapperProps) {
  const router = useRouter();
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(
    null,
  );
  const [favoritedKeys, setFavoritedKeys] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ScheduleFilters>(() =>
    parseFiltersFromParams(searchParams),
  );

  const toggleHiddenSection = useCallback((crn: string) => {
    setFilters((prev) => {
      const next = new Set(prev.hiddenSections ?? []);
      if (next.has(crn)) next.delete(crn);
      else next.add(crn);
      return { ...prev, hiddenSections: next };
    });
  }, []);

  useEffect(() => {
    syncToUrl(filters);
  }, [filters]);

  const handleGenerateSchedules = async (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
    numCourses?: number,
  ) => {
    const params = new URLSearchParams(window.location.search);

    if (lockedCourseIds.length > 0) {
      params.set("lockedCourseIds", lockedCourseIds.join(","));
    } else {
      params.delete("lockedCourseIds");
    }

    if (optionalCourseIds.length > 0) {
      params.set("optionalCourseIds", optionalCourseIds.join(","));
    } else {
      params.delete("optionalCourseIds");
    }

    if (numCourses !== undefined) {
      params.set("numCourses", numCourses.toString());
    }

    router.push(`/scheduler/generator?${params.toString()}`);
  };

  const filteredSchedules = filterSchedules(initialSchedules, filters);

  const handleLockedCourseIdsChange = useCallback((ids: number[]) => {
    setFilters((prev) => ({
      ...prev,
      lockedCourseIds: ids.length > 0 ? ids : undefined,
    }));
  }, []);

  // Compute color map from all schedules (stable across filter changes)
  const colorMap = useMemo(
    () => getCourseColorMap(initialSchedules),
    [initialSchedules],
  );

  const currentScheduleKey =
    selectedScheduleKey ??
    (filteredSchedules.length > 0
      ? getScheduleKey(filteredSchedules[0])
      : null);

  const handleToggleFavorite = (key: string) => {
    setFavoritedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isFavorited = currentScheduleKey
    ? favoritedKeys.has(currentScheduleKey)
    : false;

  return (
    <div className="grid h-[calc(100vh-72px)] w-full grid-cols-6 overflow-hidden">
      <div className="col-span-1 w-full overflow-hidden">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onGenerateSchedules={handleGenerateSchedules}
          nupathOptions={nupathOptions}
          allSchedules={initialSchedules}
          hiddenSections={filters.hiddenSections ?? new Set()}
          onToggleHiddenSection={toggleHiddenSection}
          terms={terms}
          lockedCourseIds={filters.lockedCourseIds ?? []}
          onLockedCourseIdsChange={handleLockedCourseIdsChange}
        />
      </div>
      <div className="col-span-5 flex min-h-0 overflow-hidden pl-6">
        <div className="min-w-0 flex-1">
          <SchedulerView
            schedules={filteredSchedules}
            allSchedules={initialSchedules}
            selectedScheduleKey={currentScheduleKey}
            colorMap={colorMap}
            isFavorited={isFavorited}
            onToggleFavorite={() => {
              if (selectedScheduleKey) {
                handleToggleFavorite(selectedScheduleKey);
              }
            }}
          />
        </div>
        <ScheduleSidebar
          allSchedules={initialSchedules}
          filteredSchedules={filteredSchedules}
          favoritedKeys={favoritedKeys}
          selectedScheduleKey={selectedScheduleKey}
          colorMap={colorMap}
          onSelectSchedule={setSelectedScheduleKey}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
}
