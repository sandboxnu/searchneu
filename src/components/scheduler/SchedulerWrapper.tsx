"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { filterSchedules, type ScheduleFilters, type SectionWithCourse } from "@/lib/scheduler/filters";
import { SchedulerView } from "./SchedulerView";
import { FilterPanel } from "./FilterPanel";

interface SchedulerWrapperProps {
  initialSchedules: SectionWithCourse[][];
  nupathOptions: { label: string; value: string }[];
}

export function SchedulerWrapper({ initialSchedules, nupathOptions }: SchedulerWrapperProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [isPending, startTransition] = useTransition();

  const handleGenerateSchedules = async (lockedCourseIds: number[], optionalCourseIds: number[]) => {
    startTransition(() => {
      // Navigate to the same page with course IDs in the URL
      // This will trigger a server-side re-render with the new schedules
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
    Object.keys(filters).length > 0 ? filterSchedules(initialSchedules, filters) : initialSchedules;

  return (
    <div className="grid w-full grid-cols-6">
      <div className="col-span-1 w-full">
        <FilterPanel 
          filters={filters} 
          onFiltersChange={setFilters}
          onGenerateSchedules={handleGenerateSchedules}
          isGenerating={isPending}
          nupathOptions={nupathOptions}
          filteredSchedules={filteredSchedules}
        />
      </div>
      <div className="col-span-5 pl-6">
        <SchedulerView
          schedules={filteredSchedules}
          totalSchedules={initialSchedules.length}
          filters={filters}
        />
      </div>
    </div>
  );
}
