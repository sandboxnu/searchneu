"use client";

import { useState } from "react";
import { type ScheduleFilters } from "@/lib/scheduler/filters";
import { Switch } from "../ui/switch";
import { TimeInput } from "./TimeInput";
import { FilterMultiSelect } from "./FilterMultiSelect";
import { cn } from "@/lib/cn";

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

const CAMPUS_OPTIONS = [
  { label: "Boston", value: "Boston" },
  { label: "Online", value: "Online" },
  { label: "Oakland", value: "Oakland" },
  { label: "Charlotte", value: "Charlotte" },
  { label: "Seattle", value: "Seattle" },
  { label: "San Francisco", value: "San Francisco" },
  { label: "Portland, ME", value: "Portland, ME" },
  { label: "Burlington", value: "Burlington" },
  { label: "Miami", value: "Miami" },
  { label: "London", value: "London" },
  { label: "Vancouver", value: "Vancouver" },
  { label: "Toronto", value: "Toronto" },
];

const DAYS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "Th" },
  { value: 5, label: "F" },
  { value: 6, label: "Sa" },
];

interface FiltersTabProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  nupathOptions: { label: string; value: string }[];
}

export function FiltersTab({
  filters,
  onFiltersChange,
  nupathOptions,
}: FiltersTabProps) {
  // Local state for campuses (UI only until backend support is added)
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>([]);

  const updateFilter = <K extends keyof ScheduleFilters>(
    key: K,
    value: ScheduleFilters[K],
  ) => {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      // eslint-disable-next-line
      const { [key]: _, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = filters.specificDaysFree || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateFilter("specificDaysFree", newDays.length > 0 ? newDays : undefined);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* CAMPUSES */}
      <div className="flex flex-col gap-3">
        <FilterMultiSelect
          label="CAMPUSES"
          options={CAMPUS_OPTIONS}
          selected={selectedCampuses}
          onSelectedChange={setSelectedCampuses}
          placeholder="Search campuses..."
        />
      </div>

      <div className="h-px bg-[#f1f2f2]" />

      {/* TIME */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase leading-[1.5] text-[#5f5f5f]">
            Time
          </span>
          {(filters.startTime || filters.endTime) && (
            <button
              onClick={() => {
                // eslint-disable-next-line
                const { startTime: _, endTime: __, ...rest } = filters;
                onFiltersChange(rest);
              }}
              className="cursor-pointer text-xs text-[#2180E8] hover:text-[#2180E8]/80"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm",
              filters.startTime
                ? "font-semibold text-[#333]"
                : "text-[#858585]",
            )}
          >
            Start after
          </span>
          <div className="cursor-pointer rounded-lg border border-[#f1f2f2] bg-white px-2 py-1">
            <TimeInput
              value={
                filters.startTime
                  ? militaryToTimeString(filters.startTime)
                  : ""
              }
              onChange={(value) =>
                updateFilter(
                  "startTime",
                  value ? timeStringToMilitary(value) : undefined,
                )
              }
              disableAfter={
                filters.endTime
                  ? militaryToTimeString(filters.endTime)
                  : undefined
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm",
              filters.endTime
                ? "font-semibold text-[#333]"
                : "text-[#858585]",
            )}
          >
            End before
          </span>
          <div className="cursor-pointer rounded-lg border border-[#f1f2f2] bg-white px-2 py-1">
            <TimeInput
              value={
                filters.endTime ? militaryToTimeString(filters.endTime) : ""
              }
              onChange={(value) =>
                updateFilter(
                  "endTime",
                  value ? timeStringToMilitary(value) : undefined,
                )
              }
              disableBefore={
                filters.startTime
                  ? militaryToTimeString(filters.startTime)
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      <div className="h-px bg-[#f1f2f2]" />

      {/* FREE DAYS */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase leading-[1.5] text-[#5f5f5f]">
            Free Days
          </span>
          {(filters.specificDaysFree?.length ?? 0) > 0 && (
            <button
              onClick={() => updateFilter("specificDaysFree", undefined)}
              className="cursor-pointer text-xs text-[#2180E8] hover:text-[#2180E8]/80"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {DAYS.map((day) => {
            const isSelected =
              filters.specificDaysFree?.includes(day.value) ?? false;
            return (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "flex h-7 flex-1 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                  isSelected
                    ? "border border-[#fad7da] bg-[rgba(250,215,218,0.3)] text-[#e63946] hover:bg-[rgba(250,215,218,0.5)]"
                    : "border border-[#f1f2f2] bg-[#f9f9f9] text-[#858585] hover:bg-[#efefef]",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-px bg-[#f1f2f2]" />

      {/* NUPATH */}
      <div className="flex flex-col gap-3">
        <FilterMultiSelect
          label="NUPATHS"
          options={nupathOptions}
          selected={filters.nupaths ?? []}
          onSelectedChange={(values) =>
            updateFilter("nupaths", values.length > 0 ? values : undefined)
          }
          placeholder="Search NUPaths..."
        />
      </div>

      <div className="h-px bg-[#f1f2f2]" />

      {/* INCLUDE HONORS SECTIONS */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase leading-[14px] text-[#5f5f5f]">
          Include Honors Sections
        </span>
        <Switch
          checked={filters.includeHonors}
          onCheckedChange={(checked) => updateFilter("includeHonors", checked)}
          className="cursor-pointer data-[state=checked]:bg-[#e63946]"
        />
      </div>

      <div className="h-px bg-[#f1f2f2]" />

      {/* HIDE FILLED SECTIONS */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase leading-[14px] text-[#5f5f5f]">
          Hide Filled Sections
        </span>
        <Switch
          checked={(filters.minSeatsLeft ?? 0) > 0}
          onCheckedChange={(checked) =>
            updateFilter("minSeatsLeft", checked ? 1 : undefined)
          }
          className="cursor-pointer data-[state=checked]:bg-[#e63946]"
        />
      </div>
    </div>
  );
}
