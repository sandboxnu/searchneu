"use client";

import { useState, use } from "react";
import { cn } from "@/lib/cn";
import { TrackingSwitch } from "../auth/TrackingSwitch";

interface MeetingTime {
  days: number[];
  startTime: number;
  endTime: number;
  final: boolean;
  room?: Room;
  finalDate?: string;
}

export interface Room {
  id: number;
  number: string;
  building?: Building;
}

interface Building {
  id: number;
  name: string;
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

export function SectionTable({
  sectionsPromise,
  trackedSectionsPromise,
  isTermActive,
}: {
  sectionsPromise: Promise<Section[]>;
  trackedSectionsPromise: Promise<number[]>;
  isTermActive: boolean;
}) {
  const sections = use(sectionsPromise);
  const trackedSections = use(trackedSectionsPromise);

  return (
    <div className="-mx-10 overflow-x-auto px-10 [&::-webkit-scrollbar]:hidden">
      <div className="inline-block min-w-full rounded-lg border">
        <table className="w-full min-w-[1000px] table-auto">
          <colgroup>
            <col className="w-16" />
            <col className="w-20" />
            <col className="w-40" />
            <col className="w-40" />
            <col className="w-40" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="bg-secondary text-neutral-600 border-b text-xs">
              <th className="px-6 py-4 text-center font-bold">NOTIFY</th>
              <th className="px-4 py-4 text-center font-bold">CRN</th>
              <th className="px-4 py-4 text-center font-bold">
                SEATS | WAITLIST
              </th>
              <th className="px-4 py-4 text-left font-bold">MEETING TIMES</th>
              <th className="px-4 py-4 text-left font-bold">ROOMS</th>
              <th className="px-4 py-4 text-left font-bold">PROFESSOR</th>
              <th className="px-4 py-4 text-center font-bold">CAMPUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sections.map((s) => (
              <TableRow
                key={s.crn}
                section={s}
                initialTracked={trackedSections?.includes(s.id) ?? false}
                isTermActive={isTermActive}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableRow({
  section,
  initialTracked,
  isTermActive,
}: {
  section: Section;
  initialTracked: boolean;
  isTermActive: boolean;
}) {
  const seatDelta = section.seatRemaining / section.seatCapacity;
  const [tracked, setTracked] = useState(initialTracked);

  return (
    <tr className="hover:bg-secondary">
      <td className="py-5 text-right">
        <div className="flex px-6">
          <TrackingSwitch
            sectionId={section.id}
            inital={tracked}
            disabled={seatDelta > 0}
            onCheckedChange={(c) => setTracked(c)}
            isTermActive={isTermActive}
          />
        </div>
      </td>

      <td className="py-5 text-center">
        <div>
          <p className="text-foreground">{section.crn}</p>
          {section.honors && (
            <p className="mt-1 text-xs text-gray-500">honors</p>
          )}
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="flex min-w-0 flex-nowrap justify-center gap-2">
          <span
            className={cn(
              "inline-block shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
              seatDelta > 0.2 && "bg-green-100 text-green-700",
              seatDelta <= 0.2 &&
                seatDelta > 0.05 &&
                "bg-yellow-100 text-yellow-700",
              seatDelta <= 0.05 && "bg-red-100 text-red-700",
            )}
          >
            {section.seatRemaining} / {section.seatCapacity}
          </span>
          <span className="inline-block shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium whitespace-nowrap text-gray-600">
            {section.waitlistRemaining} / {section.waitlistCapacity}
          </span>
        </div>
      </td>

      <td className="px-4 py-5 align-top">
        <MeetingBlocks meetings={section.meetingTimes} crn={section.crn} />
      </td>

      <td className="px-4 py-5 align-top">
        <RoomBlocks section={section} key={section.crn} />
      </td>

      <td className="px-4 py-5">
        <div className="text-foreground">{formatFaculty(section.faculty)}</div>
      </td>

      <td className="px-4 py-5 text-center">
        <div className="flex justify-center">
          <span className="inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            {section.campus}
          </span>
        </div>
      </td>
    </tr>
  );
}

function RoomBlocks(props: { section: Section }) {
  const building = props.section.meetingTimes[0]?.room?.building?.name;
  const room = props.section.meetingTimes[0]?.room?.number;

  return (
    <div className="flex flex-col text-sm">
      {building ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-bold">{building}</div>
          <div>{room ?? "NA"}</div>
        </div>
      ) : (
        <p className="text-neutral-400 py-2 text-sm">TBA</p>
      )}
    </div>
  );
}

function MeetingBlocks(props: { meetings: MeetingTime[]; crn: string }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // always have the final be the last row
  props.meetings.sort((a) => (a.final ? 1 : -1));

  if (props.meetings.length === 0 || props.meetings[0].days.length === 0) {
    return <p className="text-neutral-400 py-2 text-sm">TBA</p>;
  }

  const hasWeekendEvents = props.meetings.some((meeting) =>
    meeting.days.some((day) => day === 0 || day === 6),
  );

  const getDaysToShow = () => {
    if (hasWeekendEvents) {
      return [...Array(7).keys()];
    } else {
      return [1, 2, 3, 4, 5];
    }
  };

  const daysToShow = getDaysToShow();

  return (
    <div className="flex w-full flex-col gap-2">
      {props.meetings.map((m, i) => (
        <div key={props.crn + i} className="flex w-full flex-col gap-1">
          <span className="flex items-center gap-1">
            {daysToShow.map((j) => (
              <span
                key={props.crn + i + j}
                className={cn(
                  "text-neutral-400 text-center text-sm font-bold",
                  m.days.includes(j) && "text-foreground",
                )}
              >
                {days[j]}
              </span>
            ))}
          </span>
          {/* TODO: this should be a hover i to say talk to the prof! */}
          <span className="flex items-center gap-1 text-sm">
            {m.final && <p className="font-semibold">Final Exam</p>}
            {m.final && <p className="">|</p>}
            <p className="text-foreground font-medium">
              {formatTimeRange(m.startTime, m.endTime)}
            </p>
          </span>
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

  const formattedStart = `${start12Hour}:${startMinutes.toString().padStart(2, "0")}`;
  const formattedEnd = `${end12Hour}:${endMinutes.toString().padStart(2, "0")}`;

  return `${formattedStart}${startIsPM ? "pm" : "am"} — ${formattedEnd}${endIsPM ? "pm" : "am"}`;
}

function formatFaculty(f: string) {
  const [lastName, firstName] = f.split(",");
  return `${firstName.trim()[0]}. ${lastName}`;
}
