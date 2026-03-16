import { type ReactNode } from "react";
import { MapPin, Clock } from "lucide-react";
import { type SavedPlan } from "../Dashboard";

// Helper to format time (minutes since midnight to HH:MM AM/PM)
function formatTime(minutes: number | null): string {
  if (minutes === null) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
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

// Get campus display text
function getCampusText(includeRemoteSections: boolean): string {
  const parts: string[] = [];
  if (includeRemoteSections) {
    parts.push("Remote");
  }
  return parts.length > 0 ? parts.join(", ") : "";
}

interface FilterTagsProps {
  plan: SavedPlan;
}

export function FilterTags({ plan }: FilterTagsProps) {
  const filterTags: ReactNode[] = [];

  // Location/Campus tag
  const campusText = getCampusText(plan.includeRemoteSections);
  if (campusText) {
    filterTags.push(
      <div
        key="location"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        <MapPin className="h-3 w-3" />
        {campusText}
      </div>,
    );
  }

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
    filterTags.push(
      <div
        key="nupaths"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        NU Paths {plan.nupaths.join(", ")}
      </div>,
    );
  }

  if (filterTags.length === 0) {
    return <p className="text-sm text-gray-500">No filters applied</p>;
  }

  return <div className="flex flex-wrap gap-2">{filterTags}</div>;
}
