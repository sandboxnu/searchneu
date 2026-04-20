"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseFiltersFromParams, syncToUrl } from "../filterParams";
import type { ScheduleFilters } from "../filters";

export function useSchedulerFilters() {
  const searchParams = useSearchParams();
  const mountedRef = useRef(false);

  const [filters, setFilters] = useState<ScheduleFilters>(() =>
    parseFiltersFromParams(searchParams),
  );

  // Sync filters to URL on every change (after initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    syncToUrl(filters);
  }, [filters]);

  const toggleHiddenSection = useCallback((sectionId: number) => {
    setFilters((prev) => {
      const next = new Set(prev.hiddenSectionIds ?? []);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return { ...prev, hiddenSectionIds: next };
    });
  }, []);

  return { filters, setFilters, toggleHiddenSection };
}
