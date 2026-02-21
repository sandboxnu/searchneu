"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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

type Params = { get(name: string): string | null };

function parseFiltersFromParams(params: Params): ScheduleFilters {
  const filters: ScheduleFilters = {
    includesOnline: params.get("online") !== "false",
    includeHonors: params.get("honors") !== "false",
  };

  const startTime = params.get("startTime");
  if (startTime) {
    const v = parseInt(startTime);
    if (!isNaN(v)) filters.startTime = v;
  }

  const endTime = params.get("endTime");
  if (endTime) {
    const v = parseInt(endTime);
    if (!isNaN(v)) filters.endTime = v;
  }

  const freeDays = params.get("freeDays");
  if (freeDays) {
    const days = freeDays
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (days.length > 0) filters.specificDaysFree = days;
  }

  const nupaths = params.get("nupaths");
  if (nupaths) {
    const values = nupaths.split(",").filter(Boolean);
    if (values.length > 0) filters.nupaths = values;
  }

  const minSeats = params.get("minSeats");
  if (minSeats) {
    const v = parseInt(minSeats);
    if (!isNaN(v)) filters.minSeatsLeft = v;
  }

  const lockedCourseIds = params.get("lockedCourseIds");
  if (lockedCourseIds) {
    const ids = lockedCourseIds
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (ids.length > 0) filters.lockedCourseIds = ids;
  }

  return filters;
}

function parseHiddenSections(params: Params): Set<string> {
  const hidden = params.get("hiddenSections");
  if (!hidden) return new Set();
  return new Set(hidden.split(",").filter(Boolean));
}

function syncToUrl(filters: ScheduleFilters, hiddenSections: Set<string>) {
  const params = new URLSearchParams(window.location.search);

  const filterKeys = [
    "startTime",
    "endTime",
    "freeDays",
    "nupaths",
    "honors",
    "online",
    "minSeats",
    "hiddenSections",
    "lockedCourseIds",
  ];
  filterKeys.forEach((k) => params.delete(k));

  if (filters.startTime != null)
    params.set("startTime", String(filters.startTime));
  if (filters.endTime != null) params.set("endTime", String(filters.endTime));
  if (filters.specificDaysFree?.length)
    params.set("freeDays", filters.specificDaysFree.join(","));
  if (filters.nupaths?.length) params.set("nupaths", filters.nupaths.join(","));
  if (filters.includeHonors === false) params.set("honors", "false");
  if (filters.includesOnline === false) params.set("online", "false");
  if (filters.minSeatsLeft != null)
    params.set("minSeats", String(filters.minSeatsLeft));
  if (hiddenSections.size > 0)
    params.set("hiddenSections", Array.from(hiddenSections).join(","));
  if (filters.lockedCourseIds?.length)
    params.set("lockedCourseIds", filters.lockedCourseIds.join(","));

  const search = params.toString();
  const url = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
}

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

  const [hiddenSections, setHiddenSections] = useState<Set<string>>(() =>
    parseHiddenSections(searchParams),
  );

  const toggleHiddenSection = useCallback((crn: string) => {
    setHiddenSections((prev) => {
      const next = new Set(prev);
      if (next.has(crn)) next.delete(crn);
      else next.add(crn);
      return next;
    });
  }, []);

  useEffect(() => {
    syncToUrl(filters, hiddenSections);
  }, [filters, hiddenSections]);

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
          nupathOptions={nupathOptions}
          filteredSchedules={filteredSchedules}
          hiddenSections={hiddenSections}
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
