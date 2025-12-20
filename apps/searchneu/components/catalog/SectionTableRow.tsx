"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { TrackingSwitch } from "../auth/TrackingSwitch";
import { MeetingBlocks, RoomBlocks } from "./SectionTableBlocks";
import type { SectionTableSection } from "./SectionTable";

export function SectionTableRow({
  section,
  initialTracked,
  isTermActive,
  showWaitlist,
}: {
  section: SectionTableSection;
  initialTracked: boolean;
  isTermActive: boolean;
  showWaitlist: boolean;
}) {
  const seatDelta = section.seatRemaining / section.seatCapacity;

  const numMeetingTimes = section.meetingTimes.length;

  const [tracked, setTracked] = useState(initialTracked);

  return (
    <tr className="hover:bg-neu2">
      <td
        className={cn("py-5 text-right", {
          "py-[23px] align-top": numMeetingTimes > 1,
        })}
      >
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

      <td
        className={cn("py-5 text-center", {
          "py-[22px] align-top": numMeetingTimes > 1,
        })}
      >
        <div>
          <p className="text-neu9">{section.crn}</p>
          {section.honors && (
            <p className="mt-1 text-xs text-gray-500">honors</p>
          )}
        </div>
      </td>

      <td className={cn("px-4 py-5", { "align-top": numMeetingTimes > 1 })}>
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
          {showWaitlist && (
            <span className="inline-block shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium whitespace-nowrap text-gray-600">
              {section.waitlistRemaining} / {section.waitlistCapacity}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-5 align-top">
        <MeetingBlocks meetings={section.meetingTimes} crn={section.crn} />
      </td>

      <td
        className={cn("align-center px-4 py-5", {
          "align-top": numMeetingTimes > 1,
        })}
      >
        <RoomBlocks section={section} key={section.crn} />
      </td>

      <td className={cn("px-4 py-5", { "align-top": numMeetingTimes > 1 })}>
        <div className="text-neu9">{formatFaculty(section.faculty)}</div>
      </td>

      <td
        className={cn("px-4 py-5 text-center", {
          "align-top": numMeetingTimes > 1,
        })}
      >
        <div className="flex justify-center">
          <span className="inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            {section.campus}
          </span>
        </div>
      </td>
    </tr>
  );
}

function formatFaculty(f: string) {
  const [lastName, firstName] = f.split(",");
  if (!lastName || !firstName) {
    return "NA";
  }
  return `${firstName.trim()[0]}. ${lastName}`;
}
