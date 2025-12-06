"use client";

import { useState, useMemo } from "react";
import { type ScheduleFilters, type SectionWithCourse } from "@/lib/scheduler/filters";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { CourseBox } from "@/components/scheduler/CourseBox";
import { getCourseColorMap, getCourseKey } from "@/lib/scheduler/courseColors";
import { FilterMultiSelect } from "./FilterMultiSelect";
import { Switch } from "../ui/switch";
import { TimeInput } from "./TimeInput";
<<<<<<< HEAD
=======
import { MoveRightIcon } from "lucide-react";
import FeedbackModal from "../feedback/FeedbackModal";
import { AddCoursesModal } from "@/components/scheduler/AddCourseModal";
>>>>>>> f452f97 (feat: add course selection modal with improved UX)

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
  term: string;
  termName: string;
}

export function FilterPanel({ filters, onFiltersChange, onGenerateSchedules, isGenerating, nupathOptions, filteredSchedules, term, termName }: FilterPanelProps) {
  const [lockedCourseIdsInput, setLockedCourseIdsInput] = useState("");
  const [optionalCourseIdsInput, setOptionalCourseIdsInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize the color map so it's only computed when filteredSchedules changes
  const colorMap = useMemo(() => getCourseColorMap(filteredSchedules), [filteredSchedules]);

  const updateFilter = <K extends keyof ScheduleFilters>(
    key: K,
    value: ScheduleFilters[K],
  ) => {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      const { [key]: _, ...rest } = filters;
      onFiltersChange(rest);
    } else {
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
    <div className="bg-background h-[calc(100vh-72px)] w-full space-y-4 overflow-y-scroll px-2.5 pt-2.5 pb-4">
      {/* Add Courses Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={isGenerating}
        className="w-full"
      >
        Add Courses
      </Button>

      <AddCoursesModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        term={term}
        termName={termName}
        onGenerateSchedules={(courseIds) => onGenerateSchedules(courseIds, [])}
      />

      <Separator />

      {/* Locked Course IDs Input */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          LOCKED COURSE IDs
        </Label>
        <textarea
          value={lockedCourseIdsInput}
          onChange={(e) => setLockedCourseIdsInput(e.target.value)}
          placeholder="Enter locked course IDs separated by commas (e.g., 2953, 160)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 min-h-[60px] font-mono text-sm"
        />
      </div>

      {/* Optional Course IDs Input */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          OPTIONAL COURSE IDs
        </Label>
        <textarea
          value={optionalCourseIdsInput}
          onChange={(e) => setOptionalCourseIdsInput(e.target.value)}
          placeholder="Enter optional course IDs separated by commas (e.g., 142, 5857)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 min-h-[60px] font-mono text-sm"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? "Generating..." : "Generate Schedules"}
      </Button>

      <Separator />

      {/* Classes Filter*/}
      <div className="flex justify-between items-center">
        <h3 className="text-muted-foreground text-xs font-bold">CLASSES</h3>
        <button
          onClick={() => {}}
          aria-label="Edit classes"
          title="Edit classes"
          className="p-1 border border-transparent text-gray-600 rounded"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div>
        {filteredSchedules && filteredSchedules.length > 0 && (
          (() => {
            // Build a map of course -> sections
            const courseMap = new Map<string, Map<string, SectionWithCourse>>();
            for (const schedule of filteredSchedules) {
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
                {courseEntries.map(([courseKey, sectionsMap]) => (
                  <CourseBox
                    key={courseKey}
                    sections={Array.from(sectionsMap.values())}
                    color={colorMap.get(courseKey)}
                  />
                ))}
              </div>
            );
          })()
        )}
      </div>

      <Separator />
      
      {/* Online Classes */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold">
          INCLUDE REMOTE SECTIONS
        </span>
        <button
          type="button"
          onClick={() => updateFilter("includesOnline", !filters.includesOnline)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            filters.includesOnline ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              filters.includesOnline ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
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

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground whitespace-nowrap">End time is before</span>
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
          <Label className="text-muted-foreground text-xs font-bold">
            FREE DAYS
          </Label>
          {(filters.specificDaysFree?.length ?? 0) > 0 && (
            <button
              onClick={() => updateFilter("specificDaysFree", undefined)}
              className="text-blue-600 hover:text-blue-600/80 text-xs"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Day number buttons */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => updateFilter("minDaysFree", num)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                filters.minDaysFree === num
                  ? "bg-red-500 text-white"
                  : "border border-input bg-background text-foreground hover:bg-muted"
              }`}
            >
              {num}
            </button>
          ))}
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
          ].map((day) => (
            <label
              key={day.value}
              className="flex cursor-pointer items-center justify-between py-1"
            >
              <span className="text-sm text-muted-foreground">{day.label}</span>
              <input
                type="checkbox"
                checked={filters.specificDaysFree?.includes(day.value) ?? false}
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
                className="h-4 w-4 rounded border-input accent-red-500"
              />
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Hide Filled Sections Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-bold">
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
        <Label className="text-muted-foreground text-xs font-bold">
          INCLUDE HONORS
        </Label>
        <Switch
          checked={(filters.includeHonors)}
          onCheckedChange={(checked) =>
            updateFilter("includeHonors", checked)
          }
          className="data-[state=checked]:bg-red-500"
        />
      </div>
      
    </div>
  );
}
