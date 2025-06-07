"use client";

import { useSearchParams } from "next/navigation";
import { type Section, SectionCard } from "./SectionCard";
import { useState, use } from "react";
import { Button } from "../ui/button";
import { TooltipProvider } from "../ui/tooltip";

export function SectionFilterWrapper({
  sectionsPromise,
  trackedSectionsPromise,
  isTermActive,
}: {
  sectionsPromise: Promise<Section[]>;
  trackedSectionsPromise: Promise<number[]>;
  isTermActive: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const searchParams = useSearchParams();

  const sections = use(sectionsPromise);
  const trackedSections = use(trackedSectionsPromise);

  const totalSeats = sections.reduce((agg, s) => agg + s.seatCapacity, 0);
  const seatsRemaining = sections.reduce((agg, s) => agg + s.seatRemaining, 0);

  const campusFilter = searchParams.getAll("camp");
  const classTypeFilter = searchParams.getAll("clty");
  const honorsFilter = searchParams.get("honors");

  const filteredSections = sections.filter(
    (s) =>
      (campusFilter.length === 0 || campusFilter.includes(s.campus)) &&
      (classTypeFilter.length === 0 || classTypeFilter.includes(s.classType)) &&
      (!honorsFilter || s.honors),
  );

  return (
    <TooltipProvider delayDuration={700}>
      <div className="bg-neu2 flex w-full flex-col gap-1 rounded-lg p-1">
        <p className="text-neu6 w-full text-center text-sm">
          {sections.length} Section{sections.length > 1 && "s"} | {totalSeats}{" "}
          Seat
          {totalSeats !== 1 && "s"} | {seatsRemaining} Seat
          {seatsRemaining !== 1 && "s"} Remaining
        </p>

        {filteredSections.length !== sections.length && (
          <>
            {/* TODO: better ui for hiding / showing filtered sections */}
            {!showAll && (
              <Button variant="ghost" onClick={() => setShowAll(true)}>
                Show All Sections
              </Button>
            )}

            {showAll && (
              <Button variant="ghost" onClick={() => setShowAll(false)}>
                Hide Filtered Sections
              </Button>
            )}
          </>
        )}

        {!showAll &&
          filteredSections.map((section, i) => (
            <SectionCard
              key={i}
              section={section as Section}
              initalTracked={trackedSections?.includes(section.id) ?? false}
              isTermActive={isTermActive}
            />
          ))}

        {showAll &&
          sections.map((section, i) => (
            <SectionCard
              key={i}
              section={section as Section}
              initalTracked={trackedSections?.includes(section.id) ?? false}
              isTermActive={isTermActive}
            />
          ))}
      </div>
    </TooltipProvider>
  );
}
