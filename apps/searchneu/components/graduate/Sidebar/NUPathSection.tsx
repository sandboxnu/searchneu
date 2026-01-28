"use client";

import React, { useState } from "react";
import { SidebarValidationStatus } from "./Sidebar";
import {
  NUPathEnum,
  ScheduleCourse2,
} from "../../../app/graduate/common/types";
// import { HelperToolTip } from "../Help";

interface NUPathSectionProps {
  coursesTaken: ScheduleCourse2<unknown>[];
  dndIdPrefix: string;
  loading?: boolean;
}

const nuPathDisplayAndAbbr: [
  nupath: NUPathEnum,
  displayName: string,
  abbreviation: string,
][] = [
  [NUPathEnum.ND, "Natural and Designed World", "ND"],
  [NUPathEnum.EI, "Creative Expression/Innovation", "EI"],
  [NUPathEnum.IC, "Interpreting Culture", "IC"],
  [NUPathEnum.FQ, "Formal and Quantitative Reasoning", "FQ"],
  [NUPathEnum.SI, "Societies and Institutions", "SI"],
  [NUPathEnum.AD, "Analyzing/Using Data", "AD"],
  [NUPathEnum.DD, "Difference and Diversity", "DD"],
  [NUPathEnum.ER, "Ethical Reasoning", "ER"],
  [NUPathEnum.WF, "First Year Writing", "WF"],
  [NUPathEnum.WD, "Advanced Writing in the Disciplines", "WD"],
  [NUPathEnum.WI, "Writing Intensive", "WI"],
  [NUPathEnum.EX, "Integration Experience", "EX"],
  [NUPathEnum.CE, "Capstone Experience", "CE"],
];

const NUPathSection: React.FC<NUPathSectionProps> = ({
  coursesTaken,
  dndIdPrefix,
  loading,
}) => {
  const [opened, setOpened] = useState(false);

  let validationStatus = SidebarValidationStatus.Error;
  const nupathMap: Record<string, number> = {};

  for (const course of coursesTaken) {
    if (!course.nupaths) continue;
    for (const nupath of course.nupaths) {
      nupathMap[nupath] = (nupathMap[nupath] || 0) + 1;
    }
  }

  const wiCount = nupathMap[NUPathEnum.WI] || 0;

  if (loading) {
    validationStatus = SidebarValidationStatus.Loading;
  } else if (
    Object.keys(nupathMap).length > 0 &&
    Object.keys(nupathMap).length < 13
  ) {
    validationStatus = SidebarValidationStatus.InProgress;
  } else if (Object.keys(nupathMap).length === 13 && wiCount >= 2) {
    validationStatus = SidebarValidationStatus.Complete;
  }

  // Color mapping constants
  const greenBg = "bg-[#22c55e]";
  const greenBorder = "border-[#22c55e]";
  const greyBg = "bg-neutral-400";
  const greyBorder = "border-neutral-400";
  const orangeBg = "bg-orange-500";
  const orangeBorder = "border-orange-500";

  return (
    <div className="cursor-pointer border-t border-neutral-200 select-none">
      <div
        onClick={() => setOpened(!opened)}
        className="sticky top-0 z-[1] m-0 flex flex-row items-start justify-between bg-neutral-50 p-4 font-bold text-blue-900 transition-colors duration-250 ease-in-out hover:bg-neutral-100 active:bg-neutral-200"
      >
        <div className="flex h-full flex-row gap-2">
          {/* Status Badge */}
          <div
            className={`relative mt-[2px] flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full border transition-all delay-100 duration-250 ease-in-out ${validationStatus === SidebarValidationStatus.Complete ? `${greenBg} ${greenBorder}` : ""} ${validationStatus === SidebarValidationStatus.Error ? `${greyBg} ${greyBorder}` : ""} ${validationStatus === SidebarValidationStatus.InProgress ? `${orangeBg} ${orangeBorder}` : ""} ${validationStatus === SidebarValidationStatus.Loading ? `bg-transparent ${greyBorder}` : ""} `}
          >
            {/* Check Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className={`absolute h-[9px] w-[9px] text-white transition-opacity delay-100 duration-250 ease-in-out ${
                validationStatus === SidebarValidationStatus.Complete
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>

            {/* Close Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={`absolute h-[11px] w-[11px] text-white transition-opacity delay-100 duration-250 ease-in-out ${
                validationStatus === SidebarValidationStatus.Error
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>

            {/* Spinner (CSS implementation) */}
            <div
              className={`absolute h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent transition-opacity delay-100 duration-250 ease-in-out ${
                validationStatus === SidebarValidationStatus.Loading
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />

            {/* In Progress dots */}
            <span
              className={`absolute text-[10px] font-bold text-white transition-opacity delay-100 duration-250 ease-in-out ${
                validationStatus === SidebarValidationStatus.InProgress
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            >
              ...
            </span>
          </div>

          <p className="mt-0 text-sm text-blue-900">NUpath Requirements</p>
        </div>

        <div className="ml-2 flex items-center">
          {opened ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      <div
        className={`cursor-default border-t-[0.5px] border-neutral-200 bg-neutral-100 p-[10px_20px_15px_10px] ${
          opened ? "block" : "hidden"
        }`}
      >
        {loading && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
            <p className="text-sm">Loading...</p>
          </div>
        )}
        {opened && !loading && (
          <div id={dndIdPrefix} className="pt-2 pl-2">
            <p className="mb-2 text-sm italic">
              Complete the following NUpath requirements:
            </p>
            {nuPathDisplayAndAbbr.map(
              ([nupath, displayName, abbreviation], idx) => {
                const numTaken = nupathMap[nupath] || 0;
                return (
                  <NUPathRequirement
                    key={idx}
                    nupath={nupath}
                    abbreviation={abbreviation}
                    displayName={displayName}
                    numTaken={numTaken}
                  />
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface NUPathRequirementProps {
  nupath: string;
  abbreviation: string;
  displayName: string;
  numTaken: number;
}

const NUPathRequirement: React.FC<NUPathRequirementProps> = ({
  nupath,
  abbreviation,
  displayName,
  numTaken,
}) => {
  const isWI = nupath === NUPathEnum.WI;
  const isSatisfied = (isWI && numTaken >= 2) || (!isWI && numTaken >= 1);

  return (
    <div className="my-2 ml-2 flex gap-2">
      <div
        className={`relative mt-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all delay-100 duration-250 ease-in-out ${isSatisfied ? "border-[#22c55e] bg-[#22c55e]" : "border-neutral-400 bg-neutral-400"} `}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className={`absolute h-[9px] w-[9px] text-white transition-opacity delay-100 duration-250 ease-in-out ${
            isSatisfied ? "opacity-100" : "opacity-0"
          }`}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className={`absolute h-[11px] w-[11px] text-white transition-opacity delay-100 duration-250 ease-in-out ${
            !isSatisfied ? "opacity-100" : "opacity-0"
          }`}
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold">{abbreviation}</span>
        <span className="text-sm">{displayName}</span>
        {/* {isWI && <HelperToolTip label="Complete 2 Writing Intensive courses" />} */}
      </div>
    </div>
  );
};

export default NUPathSection;
