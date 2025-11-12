"use client";

import { useState } from "react";
import { type ScheduleFilters } from "@/lib/scheduler/filters";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  onGenerateSchedules: (courseIds: number[]) => void;
  isGenerating: boolean;
  nupathOptions: { label: string; value: string }[];
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onGenerateSchedules,
  isGenerating,
  nupathOptions,
}: FilterPanelProps) {
  const [courseIdsInput, setCourseIdsInput] = useState("");

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

  const clearFilters = () => onFiltersChange({ isOnline: true });

  const handleGenerate = () => {
    // Parse course IDs from input
    const courseIds = courseIdsInput
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    if (courseIds.length > 0) {
      onGenerateSchedules(courseIds);
    }
  };

  return (
    <div className="bg-background h-[calc(100vh-72px)] w-full space-y-4 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden">
      {/* Course IDs Input */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          COURSE IDs
        </Label>
        <textarea
          value={courseIdsInput}
          onChange={(e) => setCourseIdsInput(e.target.value)}
          placeholder="Enter course IDs separated by commas (e.g., 17500, 16048)"
          className="mt-2 min-h-[80px] w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-2 w-full"
        >
          {isGenerating ? "Generating..." : "Generate Schedules"}
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-bold">FILTERS</h3>
        <button
          onClick={clearFilters}
          className="rounded bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200"
        >
          Clear All
        </button>
      </div>

      {/* Start Time Filter */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          EARLIEST START TIME
        </Label>
        <input
          type="time"
          value={
            filters.startTime ? militaryToTimeString(filters.startTime) : ""
          }
          onChange={(e) =>
            updateFilter(
              "startTime",
              e.target.value ? timeStringToMilitary(e.target.value) : undefined,
            )
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* End Time Filter */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          LATEST END TIME
        </Label>
        <input
          type="time"
          value={filters.endTime ? militaryToTimeString(filters.endTime) : ""}
          onChange={(e) =>
            updateFilter(
              "endTime",
              e.target.value ? timeStringToMilitary(e.target.value) : undefined,
            )
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <Separator />

      {/* Min Days Free */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          MIN DAYS FREE
        </Label>
        <input
          type="number"
          min="0"
          max="7"
          value={filters.minDaysFree ?? ""}
          onChange={(e) =>
            updateFilter(
              "minDaysFree",
              e.target.value ? parseInt(e.target.value) : undefined,
            )
          }
          placeholder="0-7"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Days Free Checkboxes */}
      <div>
        <Label className="text-muted-foreground mb-2 block text-xs font-bold">
          SPECIFIC DAYS FREE
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 0, label: "Sun" },
            { value: 1, label: "Mon" },
            { value: 2, label: "Tue" },
            { value: 3, label: "Wed" },
            { value: 4, label: "Thu" },
            { value: 5, label: "Fri" },
            { value: 6, label: "Sat" },
          ].map((day) => (
            <label
              key={day.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
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
                    newDays.length > 0 ? newDays : undefined,
                  );
                }}
                className="rounded"
              />
              <span className="text-sm">{day.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Online Classes */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold">
          INCLUDE ONLINE CLASSES
        </span>
        <button
          type="button"
          onClick={() => updateFilter("isOnline", !filters.isOnline)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            filters.isOnline ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              filters.isOnline ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <Separator />

      {/* Min Seats Left */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          MIN SEATS AVAILABLE
        </Label>
        <input
          type="number"
          min="0"
          value={filters.minSeatsLeft ?? ""}
          onChange={(e) =>
            updateFilter(
              "minSeatsLeft",
              e.target.value ? parseInt(e.target.value) : undefined,
            )
          }
          placeholder="Any"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Min Honors Courses */}
      <div>
        <Label className="text-muted-foreground text-xs font-bold">
          MIN HONORS COURSES
        </Label>
        <input
          type="number"
          min="0"
          value={filters.minHonorsCourses ?? ""}
          onChange={(e) =>
            updateFilter(
              "minHonorsCourses",
              e.target.value ? parseInt(e.target.value) : undefined,
            )
          }
          placeholder="Any"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <Separator />

      {/* NUPath Requirement */}
      <div>
        <Label className="text-muted-foreground mb-2 block text-xs font-bold">
          NUPATH REQUIREMENTS
        </Label>
        <div className="flex flex-wrap gap-2">
          {nupathOptions.map((nupath) => (
            <label
              key={nupath.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={filters.nupaths?.includes(nupath.value) ?? false}
                onChange={(e) => {
                  const currentNupaths = filters.nupaths || [];
                  const newNupaths = e.target.checked
                    ? [...currentNupaths, nupath.value]
                    : currentNupaths.filter((n) => n !== nupath.value);
                  updateFilter(
                    "nupaths",
                    newNupaths.length > 0 ? newNupaths : undefined,
                  );
                }}
                className="rounded"
              />
              <span className="text-sm">{nupath.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
