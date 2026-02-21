"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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

interface SchedulerWrapperProps {
  initialSchedules: SectionWithCourse[][];
  nupathOptions: { label: string; value: string }[];
}

export function SchedulerWrapper({
  initialSchedules,
  nupathOptions,
}: SchedulerWrapperProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ScheduleFilters>({
    includesOnline: true,
    includeHonors: true,
  });
  const [isPending, startTransition] = useTransition();
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(
    null,
  );
  const [favoritedKeys, setFavoritedKeys] = useState<Set<string>>(new Set());

  const handleGenerateSchedules = async (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
  ) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (lockedCourseIds.length > 0) {
        params.set("lockedCourseIds", lockedCourseIds.join(","));
      }
      if (optionalCourseIds.length > 0) {
        params.set("optionalCourseIds", optionalCourseIds.join(","));
      }
      router.push(`/scheduler?${params.toString()}`);
    });
  };

  // Apply filters
  const filteredSchedules =
    Object.keys(filters).length > 0
      ? filterSchedules(initialSchedules, filters)
      : initialSchedules;

  // Compute color map from all schedules (stable across filter changes)
  const colorMap = useMemo(
    () => getCourseColorMap(initialSchedules),
    [initialSchedules],
  );

  // Auto-select first filtered schedule when none is selected
  useEffect(() => {
    if (!selectedScheduleKey && filteredSchedules.length > 0) {
      setSelectedScheduleKey(getScheduleKey(filteredSchedules[0]));
    }
  }, [selectedScheduleKey, filteredSchedules]);

  const handleToggleFavorite = (key: string) => {
    setFavoritedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isFavorited = selectedScheduleKey
    ? favoritedKeys.has(selectedScheduleKey)
    : false;

  return (
    <div className="grid h-[calc(100vh-72px)] w-full grid-cols-6 overflow-hidden">
      <div className="col-span-1 w-full overflow-hidden">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onGenerateSchedules={handleGenerateSchedules}
          isGenerating={isPending}
          nupathOptions={nupathOptions}
          filteredSchedules={filteredSchedules}
        />
      </div>
      <div className="col-span-5 flex min-h-0 overflow-hidden pl-6">
        <div className="min-w-0 flex-1">
          <SchedulerView
            schedules={filteredSchedules}
            allSchedules={initialSchedules}
            selectedScheduleKey={selectedScheduleKey}
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
