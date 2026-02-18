"use client";

import { Eye, EyeOff, User } from "lucide-react";
import type { SectionWithCourse } from "@/lib/scheduler/filters";

interface SectionRowProps {
  section: SectionWithCourse;
  hidden: boolean;
  onToggleHidden: () => void;
}

export function SectionRow({ section, hidden, onToggleHidden }: SectionRowProps) {
  const seatDelta = section.seatCapacity > 0 ? section.seatRemaining / section.seatCapacity : 0;

  const EyeIcon = hidden ? EyeOff : Eye;

  return (
    <div className={`flex items-start gap-2 px-3 py-2 transition-opacity ${hidden ? "opacity-30" : ""}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-xs font-bold text-[#5f5f5f]">
          CRN {section.crn}
        </span>
        <div className="flex flex-col gap-1 text-sm">
          <MeetingTimes meetings={section.meetingTimes} />
        </div>
        <span className="truncate text-sm text-[#858585]">
          {formatFaculty(section.faculty)}
        </span>
        <SeatBadge remaining={section.seatRemaining} capacity={section.seatCapacity} delta={seatDelta} />
      </div>
      <EyeIcon
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer text-[#a3a3a3] transition-colors hover:text-[#666]"
        onClick={onToggleHidden}
      />
    </div>
  );
}

function SeatBadge({ remaining, capacity, delta }: { remaining: number; capacity: number; delta: number }) {
  if (delta > 0.2) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#d6f5e2] bg-[rgba(214,245,226,0.4)] px-2 py-1 text-xs text-[#178459]">
        <User className="h-3.5 w-3.5" />
        {remaining} / {capacity}
      </span>
    );
  }
  if (delta > 0.05) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50/40 px-2 py-1 text-xs text-yellow-700">
        <User className="h-3.5 w-3.5" />
        {remaining} / {capacity}
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-red-200 bg-red-50/40 px-2 py-1 text-xs text-red-700">
      <User className="h-3.5 w-3.5" />
      {remaining} / {capacity}
    </span>
  );
}

function MeetingTimes({
  meetings,
}: {
  meetings: SectionWithCourse["meetingTimes"];
}) {
  const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];

  if (!meetings || meetings.length === 0 || meetings[0].days.length === 0) {
    return <span className="text-[#858585]">TBA</span>;
  }

  return (
    <>
      {meetings.map((m, i) => {
        const days = Array.from(new Set(m.days)).sort((a, b) => a - b);
        const timeStr = formatTimeRange(m.startTime, m.endTime);
        return (
          <span key={i} className="whitespace-nowrap">
            {days.map((d) => (
              <span key={d} className="font-semibold text-[#333]">
                {dayLetters[d]}{" "}
              </span>
            ))}
            <span className="text-[#858585]">{timeStr}</span>
          </span>
        );
      })}
    </>
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

  return `${formattedStart} ${startIsPM ? "PM" : "AM"} – ${formattedEnd} ${endIsPM ? "PM" : "AM"}`;
}

function formatFaculty(f: string) {
  const [lastName, firstName] = f.split(",");
  if (!lastName || !firstName) {
    return "NA";
  }
  return `${firstName.trim()} ${lastName.trim()}`;
}
