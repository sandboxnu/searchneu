"use client";

import { useSearchParams } from "next/navigation";
import { type Section, SectionCard } from "./SectionCard";
import { useState } from "react";
import { Button } from "../ui/button";

export function SectionFilterWrapper({
  sections,
  trackedSections,
}: {
  sections: Section[];
  trackedSections: number[];
}) {
  const [showAll, setShowAll] = useState(false);
  const searchParams = useSearchParams();

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
    <>
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
          />
        ))}

      {showAll &&
        sections.map((section, i) => (
          <SectionCard
            key={i}
            section={section as Section}
            initalTracked={trackedSections?.includes(section.id) ?? false}
          />
        ))}
    </>
  );
}
