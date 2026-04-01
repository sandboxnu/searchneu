import { type ReactNode } from "react";
import { MapPin, Clock } from "lucide-react";
import { type SavedPlan } from "../Dashboard";
import type { Nupath, Campus } from "@/lib/catalog/types";

// Helper to format time (e.g. 600 = 6:00 AM, 1230 = 12:30 PM)
function formatTime(time: number | null): string {
  if (time === null) return "";
  const hours = Math.floor(time / 100);
  const mins = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

// Helper to format free days
function formatFreeDays(days: string[]): string {
  if (days.length === 0) return "";
  const dayNames: Record<string, string> = {
    "0": "Mondays",
    "1": "Tuesdays",
    "2": "Wednesdays",
    "3": "Thursdays",
    "4": "Fridays",
    "5": "Saturdays",
    "6": "Sundays",
  };
  const formatted = days.map((d) => dayNames[d] || d).join(", ");
  return `Free ${formatted}`;
}

interface FilterTagsProps {
  plan: SavedPlan;
  campuses: Campus[];
  nupaths: Nupath[];
}

export function FilterTags({ plan, campuses, nupaths }: FilterTagsProps) {
  const filterTags: ReactNode[] = [];

  // Create lookup maps for efficient access
  const campusIdToNameMap = new Map<number, string>();
  campuses.forEach((c) => {
    campusIdToNameMap.set(c.id, c.name);
  });

  const nupathIdToShortMap = new Map<number, string>();
  nupaths.forEach((n) => {
    nupathIdToShortMap.set(n.id, n.short);
  });

  // Location/Campus tag
  const campusName =
    plan.campus !== null
      ? campusIdToNameMap.get(plan.campus) || "Unknown"
      : "Unknown";
  const remote = plan.includeRemoteSections ? ", Remote" : "";
  filterTags.push(
    <div
      key="location"
      className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
    >
      <MapPin className="h-3 w-3" />
      {`${campusName}${remote}`}
    </div>,
  );

  // Time tag
  if (plan.startTime !== null || plan.endTime !== null) {
    const timeParts: string[] = [];
    if (plan.startTime !== null) {
      timeParts.push(`Start after ${formatTime(plan.startTime)}`);
    }
    if (plan.endTime !== null) {
      timeParts.push(`End before ${formatTime(plan.endTime)}`);
    }
    if (timeParts.length > 0) {
      filterTags.push(
        <div
          key="time"
          className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
        >
          <Clock className="h-3 w-3" />
          {timeParts.join(", ")}
        </div>,
      );
    }
  }

  // Free days tag
  const freeDaysText = formatFreeDays(plan.freeDays);
  if (freeDaysText) {
    filterTags.push(
      <div
        key="free-days"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        {freeDaysText}
      </div>,
    );
  }

  // NUPaths tag
  if (plan.nupaths.length > 0) {
    const nupathDisplays = plan.nupaths
      .map((id) => nupathIdToShortMap.get(id) || "Unknown")
      .filter((name) => name !== "Unknown");
    if (nupathDisplays.length > 0) {
      filterTags.push(
        <div
          key="nupaths"
          className="bg-neu2 text-neu8 gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
        >
          <span className="text-neu7 mb-3 text-xs font-bold">NU Paths </span>{" "}
          {nupathDisplays.join(", ")}
        </div>,
      );
    }
  }

  if (filterTags.length === 0) {
    return <p className="text-sm text-gray-500">No filters applied</p>;
  }

  return <div className="flex flex-wrap gap-2">{filterTags}</div>;
}
