"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { CoursesTab } from "./CoursesTab";
import { FiltersTab } from "./FiltersTab";
import AddCoursesModal from "./AddCoursesModal";
import { GroupedTerms } from "@/lib/types";

interface FilterPanelProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  nupathOptions: { label: string; value: string }[];
  filteredSchedules: SectionWithCourse[][];
  hiddenSections: Set<string>;
  onToggleHiddenSection: (crn: string) => void;
  terms: Promise<GroupedTerms>;
  onGenerateSchedules: (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
    numCourses?: number,
  ) => void;
  lockedCourseIds: number[];
  onLockedCourseIdsChange: (ids: number[]) => void;
}

type Tab = "courses" | "filters";

export function FilterPanel({
  filters,
  onFiltersChange,
  nupathOptions,
  filteredSchedules,
  hiddenSections,
  onToggleHiddenSection,
  onGenerateSchedules,
  terms,
  lockedCourseIds,
  onLockedCourseIdsChange,
}: FilterPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-background flex h-full w-75 flex-col gap-6 overflow-hidden rounded-lg p-6">
      {/* Course Modal */}
      <AddCoursesModal
        open={isModalOpen}
        closeFn={() => setIsModalOpen(false)}
        terms={terms}
        selectedTerm={null}
        onGenerateSchedules={onGenerateSchedules}
      />
      {/* Tabs */}
      <div className="flex w-fit gap-4 border-b border-[#e0e0e0]">
        <button
          onClick={() => setActiveTab("courses")}
          className={`translate-y-px cursor-pointer py-1 text-xs leading-3.5 font-bold uppercase transition-colors ${
            activeTab === "courses"
              ? "border-b border-[#a3a3a3] text-[#858585]"
              : "text-[#c2c2c2] hover:text-[#a3a3a3]"
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => setActiveTab("filters")}
          className={`translate-y-px cursor-pointer py-1 text-xs leading-3.5 font-bold uppercase transition-colors ${
            activeTab === "filters"
              ? "border-b border-[#a3a3a3] text-[#858585]"
              : "text-[#c2c2c2] hover:text-[#a3a3a3]"
          }`}
        >
          Filters
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "courses" ? (
          <CoursesTab
            filteredSchedules={filteredSchedules}
            hiddenSections={hiddenSections}
            onToggleHiddenSection={onToggleHiddenSection}
            lockedCourseIds={lockedCourseIds}
            onLockedCourseIdsChange={onLockedCourseIdsChange}
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#f1f2f2] bg-[#f9f9f9] px-4 py-2 transition-colors hover:bg-[#f0f0f0]"
        >
          <Pencil className="h-2.5 w-2.5 text-[#a3a3a3]" />
          <span className="text-sm font-semibold text-[#a3a3a3]">
            Edit Courses
          </span>
        </button>
      )}
    </div>
  );
}
