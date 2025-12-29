"use client";

import { Fragment, type ReactNode } from "react";

import type { SectionWithCourse } from "@/lib/scheduler/filters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

interface SectionDetailPopoverProps {
  section: SectionWithCourse,
  children: ReactNode
}

export function SectionDetailPopover({ section, children }: SectionDetailPopoverProps) {

  const isScheduled = section.meetingTimes && section.meetingTimes.length > 0;
  const meetingTime = section.meetingTimes?.[0];
  const seatDelta = section.seatRemaining / section.seatCapacity;


  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 bg-neu1 shadow-lg border-0" align="start" side="right" sideOffset={8}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 relative bg-neu2 stroke-neu3 rounded-t-xl">
          <h2 className="text-xl font-bold text-neu9">
            {section.courseSubject} {section.courseNumber}
          </h2>
          <p className="text-sm text-neu6 mt-1">{section.courseName}</p>
        </div>

        {/* Content */}
        <div className="pt-2 pb-4 px-6 space-y-3">
          {/* CRN */}
          <div className="flex py-2">
            <span className="text-sm font-bold text-neu6 uppercase tracking-wide w-36 shrink-0">CRN</span>
            <span className="text-base text-neu8">{section.crn}</span>
          </div>

          {/* Seats / Waitlist */}
          <div className="flex py-2">
            <span className="text-sm font-bold text-neu6 uppercase tracking-wide w-36 shrink-0">Seats | Waitlist</span>
            <div className="flex gap-2">
              <span
                className={cn(
                  "inline-block shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
                  seatDelta > 0.2 && "bg-green-100 text-green",
                  seatDelta <= 0.2 && seatDelta > 0.05 && "bg-yellow-100 text-yellow",
                  seatDelta <= 0.05 && "bg-red-100 text-red",
                )}
              >
                {section.seatRemaining} / {section.seatCapacity}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-neu6 text-sm font-medium">
                {section.waitlistRemaining ?? 0}/{section.waitlistCapacity ?? 0}
              </span>
            </div>
          </div>

          {/* Meeting Times */}
          <div className="flex py-2">
            <span className="text-sm font-bold text-neu6 uppercase tracking-wide w-36 shrink-0">Meeting Times</span>
            <div>
              {!isScheduled ? (
                <span className="text-sm italic text-neu6">Asynchronous</span>
              ) : (
                <>
                  <div className="text-base text-neu9 mb-1">
                    {formatMeetingDays(meetingTime.days)}
                  </div>
                  <div className="text-sm text-neu8">
                    {formatTime(meetingTime.startTime)}–{formatTime(meetingTime.endTime)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Room */}
          <div className="flex py-2">
            <span className="text-sm font-bold text-neu6 uppercase tracking-wide w-36 shrink-0">Room</span>
            <span className="text-base text-neu8">{parseSectionRoom(section)}</span>
          </div>

          {/* Professor */}
          {section.faculty && (
            <div className="flex py-2">
              <span className="text-sm font-bold text-neu6 uppercase tracking-wide w-36 shrink-0">Professor</span>
              <span className="text-base text-neu8">{section.faculty}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const formatMeetingDays = (meetingDays: number[]): ReactNode => {
  const meetsOnWeekend = meetingDays.includes(0) || meetingDays.includes(6)

  const dayLabels = meetsOnWeekend
    ? ["S", "M", "T", "W", "TH", "F", "S"]
    : ["M", "T", "W", "TH", "F"];

  const dayIndices = meetsOnWeekend
    ? [0, 1, 2, 3, 4, 5, 6]
    : [1, 2, 3, 4, 5];

  return (
    <span className="tracking-wide">
      {dayIndices.map((dayIndex, idx) => {
        const isMeetingDay = meetingDays.includes(dayIndex)
        return (
          <Fragment key={dayIndex}>
            {idx > 0 && " "}
            <span className={isMeetingDay ? "font-bold text-neu8" : "text-neu4"}>
              {dayLabels[meetsOnWeekend ? dayIndex : dayIndex - 1]}
            </span>
          </Fragment>
        )
      })}
    </span>
  )
}

const parseSectionRoom = (section: SectionWithCourse): string => {
  if (section.campus === "Online") {
    return "Online";
  }

  const room = section.meetingTimes[0]?.room;
  if (room?.building) {
    return `${room.building.name} ${room.number}`;
  }

  return "TBA";
}

const formatTime = (time: number): string => {
  const hours = Math.floor(time / 100)
  const minutes = time % 100
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}