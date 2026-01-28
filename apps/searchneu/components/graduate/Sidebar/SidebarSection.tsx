"use client";

import React, { useState } from "react";
import SectionRequirement from "./SectionRequirement";
import { SidebarValidationStatus } from "./Sidebar";
import { ScheduleCourse2, Section } from "../../../app/graduate/common/types";

interface SidebarSectionProps {
  section: Section;
  courseData: { [id: string]: ScheduleCourse2<null> };
  dndIdPrefix: string;
  validationStatus: SidebarValidationStatus;
  coursesTaken: ScheduleCourse2<unknown>[];
  loading?: boolean;
  isSharedPlan?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  section,
  courseData,
  dndIdPrefix,
  validationStatus,
  loading,
  coursesTaken,
  isSharedPlan,
}) => {
  const [opened, setOpened] = useState(false);

  // Color mapping constants to match your theme
  const greenBg = "bg-[#22c55e]";
  const greenBorder = "border-[#22c55e]";
  const greyBg = "bg-neutral-400";
  const greyBorder = "border-neutral-400";
  const orangeBg = "bg-orange-500";
  const orangeBorder = "border-orange-500";

  const warningLabel = section.warnings && (
    <div className="space-y-2 p-2">
      <p className="text-sm">
        Unfortunately, we currently have no way of verifying the following.
        Please take a closer look yourself.
      </p>
    </div>
  );

  return (
    <div className="cursor-pointer border-t border-neutral-200 select-none">
      {/* Header Container */}
      <div
        onClick={() => setOpened(!opened)}
        className="sticky top-0 z-[1] m-0 flex flex-row items-start justify-between bg-neutral-50 px-4 py-3 font-bold text-blue-900 transition-colors duration-250 ease-in-out hover:bg-neutral-100 active:bg-neutral-200"
      >
        <div className="flex h-full flex-row gap-2">
          {/* Status Indicator Circle */}
          <div
            className={`relative mt-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all delay-100 duration-250 ease-in-out ${validationStatus === SidebarValidationStatus.Complete ? `${greenBg} ${greenBorder}` : ""} ${validationStatus === SidebarValidationStatus.Error ? `${greyBg} ${greyBorder}` : ""} ${validationStatus === SidebarValidationStatus.InProgress ? `${orangeBg} ${orangeBorder}` : ""} ${validationStatus === SidebarValidationStatus.Loading ? `bg-transparent ${greyBorder}` : ""} `}
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

            {/* Small Close Icon */}
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

            {/* Loading Spinner */}
            <div
              className={`absolute h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent transition-opacity delay-100 duration-250 ease-in-out ${
                validationStatus === SidebarValidationStatus.Loading
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />

            {/* In Progress Text */}
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

          <p className="mt-0 text-sm text-blue-900">{section.title}</p>
        </div>

        {/* Right Side Icons */}
        <div className="ml-2 flex items-center gap-1">
          {opened ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 text-blue-900"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 text-blue-900"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      {/* Content Area */}
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
          <>
            {section.minRequirementCount < section.requirements.length && (
              <p className="mb-2 text-sm italic">
                Complete {section.minRequirementCount} of the following:
              </p>
            )}
            {section.requirements.map((requirement: any, index: number) => (
              <SectionRequirement
                requirement={requirement}
                courseData={courseData}
                dndIdPrefix={dndIdPrefix + "-" + index}
                key={index}
                coursesTaken={coursesTaken}
                isSharedPlan={isSharedPlan}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SidebarSection;
