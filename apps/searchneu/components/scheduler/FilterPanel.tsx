"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { CoursesTab } from "./CoursesTab";
import { FiltersTab } from "./FiltersTab";

interface FilterPanelProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  nupathOptions: { label: string; value: string }[];
  filteredSchedules: SectionWithCourse[][];
  hiddenSections: Set<string>;
  onToggleHiddenSection: (crn: string) => void;
}

type Tab = "courses" | "filters";

export function FilterPanel({
  filters,
  onFiltersChange,
  nupathOptions,
  filteredSchedules,
  hiddenSections,
  onToggleHiddenSection,
}: FilterPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("courses");

  return (
    <div className="bg-background flex h-full w-75 flex-col gap-6 overflow-hidden rounded-lg p-6">
      {/* Tabs */}
      <div className="flex w-fit gap-4 border-b border-[#e0e0e0]">
        <button
          onClick={() => setActiveTab("courses")}
          className={`cursor-pointer translate-y-px py-1 text-xs font-bold uppercase leading-3.5 transition-colors ${
            activeTab === "courses"
              ? "border-b border-[#a3a3a3] text-[#858585]"
              : "text-[#c2c2c2] hover:text-[#a3a3a3]"
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => setActiveTab("filters")}
          className={`cursor-pointer translate-y-px py-1 text-xs font-bold uppercase leading-3.5 transition-colors ${
            activeTab === "filters"
              ? "border-b border-[#a3a3a3] text-[#858585]"
              : "text-[#c2c2c2] hover:text-[#a3a3a3]"
          }`}
        >
          Filters
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1">
        {activeTab === "courses" ? (
          <CoursesTab
            filteredSchedules={filteredSchedules}
            hiddenSections={hiddenSections}
            onToggleHiddenSection={onToggleHiddenSection}
          />
        ) : (
          <FiltersTab
            filters={filters}
            onFiltersChange={onFiltersChange}
            nupathOptions={nupathOptions}
          />
        )}
      </div>

      {/* Edit Courses button - courses tab only */}
      {activeTab === "courses" && (
        <button className="flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#f1f2f2] bg-[#f9f9f9] px-4 py-2 transition-colors hover:bg-[#f0f0f0]">
          <Pencil className="h-2.5 w-2.5 text-[#a3a3a3]" />
          <span className="text-sm font-semibold text-[#a3a3a3]">
            Edit Courses
          </span>
        </button>
      )}
    </div>
  );
}
