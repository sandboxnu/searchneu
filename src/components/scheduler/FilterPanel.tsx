"use client";

import { useState, useMemo } from "react";
import { type ScheduleFilters, type SectionWithCourse } from "@/lib/scheduler/filters";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Info } from "lucide-react";
import { CourseBox } from "@/components/scheduler/CourseBox";
import { getCourseColorMap, getCourseKey } from "@/lib/scheduler/courseColors";
import { FilterMultiSelect } from "./FilterMultiSelect";
import { Switch } from "../ui/switch";
import { TimeInput } from "./TimeInput";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AddCoursesModal } from "@/components/scheduler/AddCourseModal";

// Convert time string (e.g., "09:00") to military format (e.g., 900)
function timeStringToMilitary(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 100 + minutes;
}

// Convert military time to time string
function militaryToTimeString(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

interface FilterPanelProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  onGenerateSchedules: (lockedCourseIds: number[], optionalCourseIds: number[]) => void;
  isGenerating: boolean;
  nupathOptions: { label: string; value: string }[];
  filteredSchedules: SectionWithCourse[][];
  allSchedules: SectionWithCourse[][];
  term: string;
  termName: string;
  lockedCourseKeys: string[];
}

export function FilterPanel({ filters, onFiltersChange, onGenerateSchedules, isGenerating, nupathOptions, filteredSchedules, allSchedules, term, termName, lockedCourseKeys }: FilterPanelProps) {
  const [lockedCourseIdsInput, setLockedCourseIdsInput] = useState("");
  const [optionalCourseIdsInput, setOptionalCourseIdsInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize the color map so it's only computed when allSchedules changes
  const colorMap = useMemo(() => getCourseColorMap(allSchedules), [allSchedules]);

  const updateFilter = <K extends keyof ScheduleFilters>(
    key: K,
    value: ScheduleFilters[K],
  ) => {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      const { [key]: _, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      // Special handling for minDaysFree: clear specificDaysFree if new value is less than current
      if (key === "minDaysFree" && typeof value === "number") {
        const currentMinDays = filters.minDaysFree;
        const currentSpecificDays = filters.specificDaysFree || [];
        
        // If selecting a smaller number than before, clear the specific days
        if (currentMinDays !== undefined && value < currentMinDays && currentSpecificDays.length > 0) {
          const { specificDaysFree: _, ...rest } = filters;
          onFiltersChange({ ...rest, [key]: value });
          return;
        }
      }
      
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const handleGenerate = () => {
    // Parse locked course IDs from input
    const lockedCourseIds = lockedCourseIdsInput
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));
    
    // Parse optional course IDs from input
    const optionalCourseIds = optionalCourseIdsInput
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));
    
    if (lockedCourseIds.length > 0 || optionalCourseIds.length > 0) {
      onGenerateSchedules(lockedCourseIds, optionalCourseIds);
    }
  };

  return (
    <div className="bg-background h-[calc(100vh-72px)] w-full space-y-4 overflow-y-scroll px-2.5 pt-2.5 pb-4 rounded-lg border">
      <AddCoursesModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        term={term}
        termName={termName}
        onGenerateSchedules={onGenerateSchedules}
      />

      {/* Classes Filter*/}
      <div className="flex justify-between items-center">
        <h3 className="text-neu7 text-xs font-bold">CLASSES</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          aria-label={allSchedules.length > 0 ? "Edit courses" : "Add courses"}
          title={allSchedules.length > 0 ? "Edit courses" : "Add courses"}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {allSchedules.length > 0 ? (
            <Pencil className="size-5" />
          ) : (
            <Plus className="size-5" />
          )}
        </button>
      </div>

      <div>
        {allSchedules && allSchedules.length > 0 && (
          (() => {
            // Build a map of course -> sections
            const courseMap = new Map<string, Map<string, SectionWithCourse>>();
            for (const schedule of allSchedules) {
              for (const section of schedule) {
                const courseKey = getCourseKey(section);
                if (!courseMap.has(courseKey)) courseMap.set(courseKey, new Map());
                const inner = courseMap.get(courseKey)!;
                if (!inner.has(section.crn)) inner.set(section.crn, section);
              }
            }

            // Sort courses alphabetically
            const courseEntries = Array.from(courseMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

            return (
              <div className="mt-2">
                {courseEntries.map(([courseKey, sectionsMap]) => {
                  const sections = Array.from(sectionsMap.values());
                  const isLocked = lockedCourseKeys.includes(courseKey);
                  
                  return (
                    <CourseBox
                      key={courseKey}
                      sections={sections}
                      color={colorMap.get(courseKey)}
                      isLocked={isLocked}
                    />
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      <Separator />
      
      {/* Online Classes */}
      <div className="mt-2 flex items-center justify-between">
        <Label className="text-neu7 text-xs font-bold">
          INCLUDE REMOTE SECTIONS
        </Label>
        <Switch
          checked={filters.includesOnline ?? true}
          onCheckedChange={(checked) =>
            updateFilter("includesOnline", checked)
          }
        />
      </div>

      <Separator />

      {/* Time Section */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-xs font-bold">TIME</Label>
        
        <div className="flex items-center justify-between text-sm pb-1.5">
          <span className="text-muted-foreground whitespace-nowrap">Start time is after</span>
          <TimeInput
            value={
              filters.startTime ? militaryToTimeString(filters.startTime) : ""
            }
            onChange={(value) =>
              updateFilter(
                "startTime",
                value ? timeStringToMilitary(value) : undefined
              )
            }
          />
        </div>

        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">End time is before</span>
          <TimeInput
            value={filters.endTime ? militaryToTimeString(filters.endTime) : ""}
            onChange={(value) =>
              updateFilter(
                "endTime",
                value ? timeStringToMilitary(value) : undefined
              )
            }
          />
        </div>        
      </div>

      <Separator />

      {/* Free Days Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neu7 text-xs font-bold">
            FREE DAYS
          </Label>
          <div className="flex items-center gap-2">
            {filters.minDaysFree && (
              <button
                onClick={() => updateFilter("minDaysFree", undefined)}
                className="text-blue-600 hover:text-blue-600/80 text-xs"
              >
                Clear all
              </button>
            )}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-neu6 hover:text-black transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p>Select a number to filter schedules with at least that many free days.</p>
                  <p>Use the checkboxes below to specify which days must be free.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Day number buttons */}
        <div className="border border-gray-300 rounded-full p-1 flex gap-0">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const isSelected = filters.minDaysFree === num;
            return (
              <button
                key={num}
                onClick={() => {
                  if (isSelected) {
                    // When deselecting, also clear all specific day checkboxes
                    const { minDaysFree: _, specificDaysFree: __, ...rest } = filters;
                    onFiltersChange(rest);
                  } else {
                    updateFilter("minDaysFree", num);
                  }
                }}
                aria-label={`${num} free days`}
                className={`flex-1 h-7 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-neu text-white hover:bg-neu/90"
                    : "bg-transparent text-foreground hover:bg-muted"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Day checkboxes */}
        <div className="space-y-2">
          {[
            { value: 1, label: "Monday" },
            { value: 2, label: "Tuesday" },
            { value: 3, label: "Wednesday" },
            { value: 4, label: "Thursday" },
            { value: 5, label: "Friday" },
            { value: 6, label: "Saturday" },
            { value: 0, label: "Sunday" },
          ].map((day) => {
            const isChecked = filters.specificDaysFree?.includes(day.value) ?? false;
            const checkedCount = filters.specificDaysFree?.length ?? 0;
            const maxDays = filters.minDaysFree ?? Infinity;
            const isDisabled = !isChecked && checkedCount >= maxDays;
            
            return (
              <label
                key={day.value}
                className={`flex items-center justify-between py-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`text-sm ${isChecked ? 'text-black font-medium' : isDisabled ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  {day.label}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => {
                    const currentDays = filters.specificDaysFree || [];
                    const newDays = e.target.checked
                      ? [...currentDays, day.value]
                      : currentDays.filter((d) => d !== day.value);
                    updateFilter(
                      "specificDaysFree",
                      newDays.length > 0 ? newDays : undefined
                    );
                  }}
                  className="h-4 w-4 rounded border-input accent-neu disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Hide Filled Sections Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-neu7 text-xs font-bold">
          HIDE FILLED SECTIONS
        </Label>
        <Switch
          checked={(filters.minSeatsLeft ?? 0) > 0}
          onCheckedChange={(checked) =>
            updateFilter("minSeatsLeft", checked ? 1 : undefined)
          }
        />
      </div>

      <Separator />

      {/* NUPath Requirement */}
      <div>
        <FilterMultiSelect
          label="NUPATHS"
          options={nupathOptions}
          selected={filters.nupaths ?? []}
          onSelectedChange={(values) =>
            updateFilter("nupaths", values.length > 0 ? values : undefined)
          }
          placeholder="Select NUPaths"
        />
      </div>

      <Separator />

      {/* Include Honors Toggle */}
      <div className="flex items-center justify-between pb-20">
        <Label className="text-neu7 text-xs font-bold">
          INCLUDE HONORS
        </Label>
        <Switch
          checked={(filters.includeHonors)}
          onCheckedChange={(checked) =>
            updateFilter("includeHonors", checked)
          }
        />
      </div>
      
    </div>
  );
}
