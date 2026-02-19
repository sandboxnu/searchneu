"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { SectionTableRow } from "./SectionTableRow";

export interface SectionTableMeetingTime {
  days: number[];
  startTime: number;
  endTime: number;
  final: boolean;
  room?: SectionTableRoom;
  finalDate?: string;
}

export interface SectionTableRoom {
  id: number;
  number: string;
  building?: SectionTableBuilding;
}

interface SectionTableBuilding {
  id: number;
  name: string;
}

export interface SectionTableSection {
  id: number;
  crn: string;
  faculty: string;
  meetingTimes: SectionTableMeetingTime[];
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
  sectionsPromise: Promise<SectionTableSection[]>;
  trackedSectionsPromise: Promise<number[]>;
  isTermActive: boolean;
}) {
  const searchParams = useSearchParams();

  const sections = use(sectionsPromise);
  const trackedSections = use(trackedSectionsPromise);

  // const totalSeats = sections.reduce((agg, s) => agg + s.seatCapacity, 0);
  // const seatsRemaining = sections.reduce((agg, s) => agg + s.seatRemaining, 0);

  const campusFilter = searchParams.getAll("camp");
  const classTypeFilter = searchParams.getAll("clty");
  const honorsFilter = searchParams.get("honors");

  const filteredSections = sections.filter(
    (s) =>
      (campusFilter.length === 0 || campusFilter.includes(s.campus)) &&
      (classTypeFilter.length === 0 || classTypeFilter.includes(s.classType)) &&
      (!honorsFilter || s.honors),
  );

  const totalWaitlistSeats = sections.reduce(
    (agg, s) => agg + s.waitlistCapacity,
    0,
  );

  return (
    <div className="w-full min-w-0 overflow-x-auto px-2 md:px-10 [&::-webkit-scrollbar]:hidden">
      <div className="min-w-max overflow-hidden rounded-lg border">
        <table className="w-full min-w-max table-auto border-collapse rounded-lg">
          <colgroup>
            <col className="min-w-16" />
            <col className="min-w-12" />
            <col className="min-w-12" />
            <col className="min-w-12" />
            <col className="min-w-12" />
            <col className="min-w-12" />
          </colgroup>
          <thead>
            <tr className="bg-secondary text-neu6 border-b text-xs">
              <th className="px-6 py-4 text-center font-bold">NOTIFY</th>
              <th className="px-4 py-4 text-center font-bold">CRN</th>
              <th className="px-4 py-4 text-center font-bold">
                {totalWaitlistSeats > 0 ? "SEATS | WAITLIST" : "SEATS"}
              </th>
              <th className="px-4 py-4 text-left font-bold">MEETING TIMES</th>
              <th className="px-4 py-4 text-left font-bold">ROOMS</th>
              <th className="px-4 py-4 text-left font-bold">PROFESSOR</th>
              <th className="px-4 py-4 text-center font-bold">CAMPUS</th>
            </tr>
          </thead>
          <tbody className="divide-neu25 divide-y">
            {filteredSections.map((s) => (
              <SectionTableRow
                key={s.crn}
                section={s}
                initialTracked={trackedSections?.includes(s.id) ?? false}
                isTermActive={isTermActive}
                showWaitlist={totalWaitlistSeats > 0}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
