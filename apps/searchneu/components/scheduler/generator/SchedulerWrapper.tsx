"use client";

import { Campus, GroupedTerms, Nupath } from "@/lib/catalog/types";
import {
  usePlanPersistence,
  useSchedulerFavorites,
  useSchedulerFilters,
  useSchedulerSchedules,
} from "@/lib/scheduler/hooks";
import { useCallback, useRef, useState } from "react";
import { SchedulerView } from "./calendar/SchedulerView";
import { FilterPanel } from "./left-sidebar/FilterPanel";
import { ScheduleSidebar } from "./right-sidebar/ScheduleSidebar";

interface SchedulerWrapperProps {
  nupathOptions: { label: string; value: string }[];
  terms: GroupedTerms;
  campuses: Campus[];
  nupaths: Nupath[];
  isLoggedIn: boolean;
}

export function SchedulerWrapper({
  nupathOptions,
  terms,
  campuses,
  nupaths,
  isLoggedIn,
}: SchedulerWrapperProps) {
  const { filters, setFilters, toggleHiddenSection } = useSchedulerFilters();

  const {
    courseIds,
    schedules,
    filteredSchedules,
    courseToSections,
    colorMap,
    currentScheduleKey,
    setSelectedScheduleKey,
    generateForCourses,
    regenerateSchedules,
  } = useSchedulerSchedules({ filters });

  const [favoritedSchedules, setFavoritedSchedules] = useState<
    Map<string, number>
  >(new Map());

  const { planId, planName } = usePlanPersistence({
    isLoggedIn,
    filters,
    courseIds,
    courseToSections,
    campuses,
    nupaths,
    onFavoritesLoaded: setFavoritedSchedules,
  });

  const { isFavorited, toggleFavorite } = useSchedulerFavorites({
    planId,
    schedules,
    filteredSchedules,
    isLoggedIn,
    favoritedSchedules,
    setFavoritedSchedules,
  });

  const prevLockedCourseIdsRef = useRef<Set<number>>(new Set());

  const handleLockedCourseIdsChange = useCallback(
    (ids: Set<number>) => {
      setFilters((prev) => ({
        ...prev,
        lockedCourseIds: ids.size > 0 ? ids : undefined,
      }));

      const wasUnlocked = Array.from(prevLockedCourseIdsRef.current).some(
        (id) => !ids.has(id),
      );
      prevLockedCourseIdsRef.current = new Set(ids);

      if (wasUnlocked) {
        regenerateSchedules(ids);
      }
    },
    [setFilters, regenerateSchedules],
  );

  const handleGenerate = useCallback(
    async (newCourseIds: number[], numCourses: number) => {
      setFilters((prev) => ({ ...prev, numCourses }));
      await generateForCourses(newCourseIds, numCourses);
    },
    [setFilters, generateForCourses],
  );

  const currentFavorited = currentScheduleKey
    ? isFavorited(currentScheduleKey)
    : false;

  return (
    <div className="flex h-[calc(100vh-72px)] w-full overflow-hidden">
      <div className="w-fit shrink-0 overflow-hidden">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          nupathOptions={nupathOptions}
          courseToSections={courseToSections}
          hiddenSectionIds={filters.hiddenSectionIds ?? new Set()}
          onToggleHiddenSection={toggleHiddenSection}
          terms={terms}
          lockedCourseIds={filters.lockedCourseIds ?? new Set()}
          onLockedCourseIdsChange={handleLockedCourseIdsChange}
          initialCourseIds={courseIds}
          onGenerate={handleGenerate}
        />
      </div>
      <div className="flex min-w-0 flex-1 overflow-hidden pl-6">
        <div className="min-w-0 flex-1">
          <p className="text-neu4 mb-1 text-sm font-bold uppercase">
            {planName}
          </p>
          <SchedulerView
            schedules={filteredSchedules}
            allSchedules={schedules}
            selectedScheduleKey={currentScheduleKey}
            colorMap={colorMap}
            isFavorited={currentFavorited}
            onToggleFavorite={() => {
              if (currentScheduleKey) toggleFavorite(currentScheduleKey);
            }}
          />
        </div>
        <ScheduleSidebar
          allSchedules={schedules}
          filteredSchedules={filteredSchedules}
          favoritedKeys={favoritedSchedules}
          selectedScheduleKey={currentScheduleKey}
          colorMap={colorMap}
          onSelectSchedule={setSelectedScheduleKey}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </div>
  );
}
