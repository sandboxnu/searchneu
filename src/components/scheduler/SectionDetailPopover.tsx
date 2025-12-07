"use client"

import React from "react"

import type { SectionWithCourse } from "@/lib/scheduler/filters"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SectionDetailPopoverProps {
  section: SectionWithCourse,
  children: React.ReactNode
}

export function SectionDetailPopover({ section, children }: SectionDetailPopoverProps) {

  const isScheduled = section.meetingTimes && section.meetingTimes.length > 0
  const meetingTime = section.meetingTimes?.[0]

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 border-gray-200 shadow-lg" align="start" side="right" sideOffset={8}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 relative bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">
            {section.courseSubject} {section.courseNumber}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{section.courseName}</p>
        </div>

        {/* Content */}
        <div className="pt-2 pb-4 px-6">
          <table className="w-full">
            <tbody>
              {/* CRN */}
              <tr className="h-12">
                <td className="text-sm font-medium text-gray-400 uppercase tracking-wide align-middle">CRN</td>
                <td className="text-base text-gray-900 align-middle">{section.crn}</td>
              </tr>

              {/* Seats / Waitlist */}
              <tr className="h-12">
                <td className="text-sm font-medium text-gray-400 uppercase tracking-wide align-middle">Seats | Waitlist</td>
                <td className="align-middle">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium">
                      {section.seatRemaining ?? 0}/{section.seatCapacity ?? 0}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                      {section.waitlistRemaining ?? 0}/{section.waitlistCapacity ?? 0}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Meeting Times */}
              <tr>
                <td className="text-sm font-medium text-gray-400 uppercase tracking-wide align-top pt-4">Meeting Times</td>
                <td className="pt-4 pb-2">
                  {!isScheduled ? (
                    <span className="text-sm italic text-gray-500">Asynchronous</span>
                  ) : (
                    <>
                      <div className="text-base text-gray-900 mb-1">
                        {formatMeetingDays(meetingTime.days)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(meetingTime.startTime)}–{formatTime(meetingTime.endTime)}
                      </div>
                    </>
                  )}
                </td>
              </tr>

              {/* Room */}
              <tr className="h-12">
                <td className="text-sm font-medium text-gray-400 uppercase tracking-wide align-middle">Room</td>
                <td className="text-base text-gray-900 align-middle">{parseSectionRoom(section)}</td>
              </tr>

              {/* Professor */}
              {section.faculty && (
                <tr className="h-12">
                  <td className="text-sm font-medium text-gray-400 uppercase tracking-wide align-middle">Professor</td>
                  <td className="text-base text-gray-900 align-middle">{section.faculty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const formatMeetingDays = (meetingDays: number[]): React.ReactNode => {
  const meetsOnWeekend = meetingDays.includes(0) || meetingDays.includes(6)

  const dayLabels = meetsOnWeekend
    ? ["S", "M", "T", "W", "TH", "F", "S"]
    : ["M", "T", "W", "TH", "F"]

  const dayIndices = meetsOnWeekend
    ? [0, 1, 2, 3, 4, 5, 6]
    : [1, 2, 3, 4, 5]

  return (
    <span className="tracking-wide">
      {dayIndices.map((dayIndex, idx) => {
        const isMeetingDay = meetingDays.includes(dayIndex)
        return (
          <React.Fragment key={dayIndex}>
            {idx > 0 && " "}
            <span className={isMeetingDay ? "font-bold text-gray-900" : "text-gray-400"}>
              {dayLabels[meetsOnWeekend ? dayIndex : dayIndex - 1]}
            </span>
          </React.Fragment>
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