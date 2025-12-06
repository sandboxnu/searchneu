"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Lock, Unlock } from "lucide-react";
import type { SectionWithCourse } from "@/lib/scheduler/filters";

interface SectionRowProps {
  section: SectionWithCourse;
}

export function SectionRow({ section }: SectionRowProps) {
  const [locked, setLocked] = useState(false);
  const seatDelta = section.seatRemaining / section.seatCapacity;
  return (
    <div className="flex items-start justify-between px-3 py-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => setLocked((l) => !l)}
          aria-label={locked ? "Unlock section" : "Lock section"}
          className="p-1 self-start"
        >
          {locked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
        <div>
          <div className="font-bold text-sm text-neu8 my-1">CRN {section.crn}</div>
          <div className="text-sm text-neu6">{formatFaculty(section.faculty)}</div>
          <div className="text-sm text-neu6 mb-1">
            <MeetingTimes meetings={section.meetingTimes} />
          </div>
          <span
            className={cn(
              "inline-block shrink-0 rounded-full px-2 py-1 text-sm font-medium whitespace-nowrap",
              seatDelta > 0.2 && "bg-green-100 text-green-700",
              seatDelta <= 0.2 &&
                seatDelta > 0.05 &&
                "bg-yellow-100 text-yellow-700",
              seatDelta <= 0.05 && "bg-red-100 text-red-700",
            )}
          >
            {section.seatRemaining} / {section.seatCapacity}
          </span>
        </div>
      </div>
    </div>
  );
}

function MeetingTimes({ meetings }: { meetings: SectionWithCourse["meetingTimes"] }) {
  const dayLetters = ["S", "M", "Tu", "W", "Th", "F", "S"];

  if (!meetings || meetings.length === 0 || meetings[0].days.length === 0) {
    return <span>TBA</span>;
  }

  return (
    <div className="flex flex-col">
      {meetings.map((m, i) => {
        const days = Array.from(new Set(m.days)).sort((a, b) => a - b);
        const daysStr = days.map((d) => dayLetters[d] ?? "").join("");
        const timeStr = formatTimeRange(m.startTime, m.endTime);
        return (
          <span key={i} className="whitespace-nowrap">
            {daysStr}: {timeStr}
          </span>
        );
      })}
    </div>
  );
}

function formatTimeRange(startTime: number, endTime: number) {
  const startHours = Math.floor(startTime / 100);
  const startMinutes = startTime % 100;
  const endHours = Math.floor(endTime / 100);
  const endMinutes = endTime % 100;

  const startIsPM = startHours >= 12;
  const endIsPM = endHours >= 12;

  const start12Hour = startHours % 12 || 12;
  const end12Hour = endHours % 12 || 12;

  const formattedStart = `${start12Hour}:${startMinutes.toString().padStart(2, "0")}`;
  const formattedEnd = `${end12Hour}:${endMinutes.toString().padStart(2, "0")}`;

  return `${formattedStart}${startIsPM ? "pm" : "am"} - ${formattedEnd}${endIsPM ? "pm" : "am"}`;
}

function formatFaculty(f: string) {
  const [lastName, firstName] = f.split(",");
  if (!lastName || !firstName) {
    return "NA";
  }
  return `${firstName.trim()[0]}. ${lastName}`;
}