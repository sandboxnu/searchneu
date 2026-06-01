"use client";

import { useState } from "react";
import { ArrowUpRight, Pencil } from "lucide-react";
import { useFeedback } from "@/components/feedback/FeedbackContext";
import {
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { CoursesTab } from "./CoursesTab";
import { FiltersTab } from "./FiltersTab";
import AddCoursesModal from "../../shared/modal/AddCoursesModal";
import { GroupedTerms } from "@/lib/catalog/types";

interface FilterPanelProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  nupathOptions: { label: string; value: string }[];
  courseToSections: Map<number, SectionWithCourse[]>;
  hiddenSectionIds: Set<number>;
  onToggleHiddenSection: (sectionId: number) => void;
  terms: GroupedTerms;
  lockedCourseIds: Set<number>;
  onLockedCourseIdsChange: (ids: Set<number>) => void;
  initialCourseIds: number[];
  onGenerate: (courseIds: number[], numCourses: number) => void;
}

type Tab = "courses" | "filters";

export function FilterPanel({
  filters,
  onFiltersChange,
  nupathOptions,
  courseToSections,
  hiddenSectionIds,
  onToggleHiddenSection,
  terms,
  lockedCourseIds,
  onLockedCourseIdsChange,
  initialCourseIds,
  onGenerate,
}: FilterPanelProps) {
  const { openFeedback } = useFeedback();
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
        initialCourseIds={initialCourseIds}
        initialNumCourses={filters.numCourses}
        onGenerate={onGenerate}
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
            courseToSections={courseToSections}
            hiddenSectionIds={hiddenSectionIds}
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

      {/* Suggest a new filter - filters tab only */}
      {activeTab === "filters" && (
        <p className="shrink-0 text-[10px]">
          <span className="text-neu5">Did we miss something?</span>{" "}
          <button
            type="button"
            onClick={() => openFeedback()}
            className="text-neu7 cursor-pointer font-bold hover:underline"
          >
            Suggest a new filter
            <ArrowUpRight className="mb-0.5 inline h-3 w-3" />
          </button>
        </p>
      )}
    </div>
  );
}
