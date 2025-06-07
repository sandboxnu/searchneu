"use client";

import { cn } from "@/lib/cn";
import {
  Armchair,
  CalendarDays,
  GraduationCap,
  Hash,
  School,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { TrackingSwitch } from "../auth/TrackingSwitch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface MeetingTime {
  building: string;
  room: string;
  days: number[];
  startTime: number;
  endTime: number;
  final: boolean;
  finalDate?: string;
}

export interface Section {
  id: number;
  crn: string;
  faculty: string;
  meetingTimes: MeetingTime[];
  campus: string;
  honors: boolean;
  classType: string;
  seatRemaining: number;
  seatCapacity: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
}

export function SectionCard({
  section,
  initalTracked,
  isTermActive,
}: {
  section: Section;
  initalTracked: boolean;
  isTermActive: boolean;
}) {
  const [tracked, setTracked] = useState(initalTracked);
  return (
    <div
      data-tracked={tracked}
      className="data-[tracked=true]:border-accent data-[tracked=true]:bg-accent/5 border-neu2 bg-neu1 grid-cols-3 rounded-lg border p-2 transition duration-300 xl:grid"
    >
      <div className="col-start-1">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Hash className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Course Reference Number (CRN)</p>
            </TooltipContent>
          </Tooltip>
          <h3 className="font-medium">{section.crn}</h3>
          {section.honors && (
            <span className="flex items-center gap-1">
              <Sparkles className="size-4" strokeWidth={1.5} />
              <p className="text-sm">Honors section</p>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <GraduationCap className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Teaching faculty</p>
            </TooltipContent>
          </Tooltip>
          <p>{section.faculty}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Armchair className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Remaining seats; this can be negative b/c of advisor overrides
              </p>
            </TooltipContent>
          </Tooltip>
          <span className="flex items-center gap-1">
            <p
              className={cn(
                "text-md",
                section.seatRemaining / section.seatCapacity > 0.2
                  ? "text-green"
                  : section.seatRemaining / section.seatCapacity > 0.05
                    ? "text-yellow"
                    : "text-red",
              )}
            >
              {section.seatRemaining} / {section.seatCapacity}
            </p>
          </span>

          {section.waitlistCapacity > 0 && (
            <p className="text-sm">
              {section.waitlistRemaining} / {section.waitlistCapacity} waitlist
            </p>
          )}
        </div>
      </div>
      <div className="col-span-2 col-start-2">
        <TrackingSwitch
          sectionId={section.id}
          inital={tracked}
          disabled={section.seatRemaining / section.seatCapacity > 0}
          onCheckedChange={(c) => setTracked(c)}
          isTermActive={isTermActive}
        />
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <School className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Campus</p>
            </TooltipContent>
          </Tooltip>
          <p>{section.campus}</p>
        </div>

        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <CalendarDays className="mt-2.5 size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Meeting times and locations</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex w-full items-center justify-between">
            <MeetingBlocks meetings={section.meetingTimes} crn={section.crn} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingBlocks(props: { meetings: MeetingTime[]; crn: string }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // always have the final be the last row
  props.meetings.sort((a) => (a.final ? 1 : -1));

  if (!props.meetings || props.meetings[0].days.length === 0) {
    return <p className="py-2 text-sm">TBA</p>;
  }

  const hasWeekendEvents = props.meetings.some((meeting) =>
    meeting.days.some((day) => day === 0 || day === 6),
  );

  const getDaysToShow = () => {
    if (hasWeekendEvents) {
      return [...Array(7).keys()]; // Show all days including weekends
    } else {
      return [1, 2, 3, 4, 5]; // Show only weekdays (M-F)
    }
  };

  const daysToShow = getDaysToShow();

  return (
    <div className="flex w-full flex-col gap-1 py-2">
      {props.meetings.map((m, i) => (
        <div key={props.crn + i} className="flex w-full justify-between">
          <div className="flex gap-2">
            <span
              className={cn(
                "bg-neu2 flex h-5 items-center justify-between rounded-md",
                daysToShow.length > 6 ? "w-[140px]" : "w-[100px]",
              )}
            >
              {daysToShow.map((j) => (
                <span
                  key={props.crn + i + j}
                  className={cn(
                    "h-full w-5 py-0.5 text-center text-xs",
                    m.days.includes(j)
                      ? m.final
                        ? "bg-accent"
                        : "bg-neu9"
                      : null,
                    m.days.includes(j) && "text-neu1 font-semibold",
                    m.days.includes(j + 1) &&
                      !m.days.includes(j - 1) &&
                      "rounded-l",
                    m.days.includes(j - 1) &&
                      !m.days.includes(j + 1) &&
                      "rounded-r",
                    !m.days.includes(j - 1) &&
                      !m.days.includes(j + 1) &&
                      "rounded",
                  )}
                >
                  {days[j]}
                </span>
              ))}
            </span>
            {/* TODO: this should be a hover i to say talk to the prof! */}
            {/* {m.final ? <p className="text-sm">i</p> : null} */}
            <span className="flex items-center gap-1 text-sm">
              {m.final && <p className="font-semibold">Final Exam</p>}
              {m.final && <p className="">|</p>}
              <p className="">{formatTimeRange(m.startTime, m.endTime)}</p>
            </span>
          </div>
          <p className="text-sm">
            {m.building ? `${m.building} ${m.room}` : "Check Syllabus"}
          </p>
        </div>
      ))}
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

  let formattedStart = `${start12Hour}:${startMinutes.toString().padStart(2, "0")}`;
  let formattedEnd = `${end12Hour}:${endMinutes.toString().padStart(2, "0")}`;

  formattedStart = formattedStart.replace(":00", "");
  formattedEnd = formattedEnd.replace(":00", "");

  if (startIsPM === endIsPM) {
    return `${formattedStart} - ${formattedEnd}${endIsPM ? "pm" : "am"}`;
  } else {
    return `${formattedStart}${startIsPM ? "pm" : "am"} - ${formattedEnd}${endIsPM ? "pm" : "am"}`;
  }
}
