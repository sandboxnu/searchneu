"use client";
import { useState } from "react";
import type { Section } from "@/lib/graduate/types";
import { SidebarValidationStatus } from "@/lib/graduate/types";
import { SectionRequirement } from "./SectionRequirement";

export interface SidebarSectionProps {
  section: Section;
  validationStatus?: SidebarValidationStatus;
  defaultOpen?: boolean;
  /** Unique prefix for drag-and-drop ids (e.g. "s0"). Passed to SectionRequirement. */
  dndIdPrefix?: string;
}

/**
 * Collapsible section row matching graduatenu SidebarSection: border, sticky header
 * with status circle and title, expandable content with requirement list.
 */
function SidebarSection({
  section,
  validationStatus = SidebarValidationStatus.Complete,
  defaultOpen = false,
  dndIdPrefix,
}: SidebarSectionProps) {
  const [opened, setOpened] = useState(defaultOpen);

  const isComplete = validationStatus === SidebarValidationStatus.Complete;
  const isError = validationStatus === SidebarValidationStatus.Error;
  const isInProgress = validationStatus === SidebarValidationStatus.InProgress;
  const isLoading = validationStatus === SidebarValidationStatus.Loading;

  return (
    <div
      className="border-neu25 cursor-pointer border-t transition-[background-color] duration-[0.25s] ease-out select-none"
      onClick={() => setOpened(!opened)}
    >
      <div className="bg-neu2 hover:bg-neu25 active:bg-neu3 sticky top-0 z-10 m-0 flex flex-row items-start justify-between px-4 py-4 font-bold transition-[background-color,border-color,color] delay-100 duration-[0.25s] ease-out">
        <div className="flex h-full flex-row gap-2">
          {/* Status circle - matches graduatenu SidebarSection */}
          <div
            className={`mt-0.5 flex h-[18px] min-h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-[0.25s] ease-out ${isComplete ? "border-green bg-green text-white" : ""} ${isError ? "border-neu5 bg-neu5 text-white" : ""} ${isInProgress ? "border-yellow bg-yellow text-white" : ""} ${isLoading ? "border-neu5 text-neu5 bg-transparent" : ""} `}
          >
            {isComplete && (
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isError && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 0 0-1.41 1.41L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.88a.996.996 0 1 0 1.41-1.41L13.41 12l4.88-4.89z" />
              </svg>
            )}
            {isLoading && (
              <div className="border-neu5 h-2.5 w-2.5 animate-spin rounded-full border-2 border-t-transparent" />
            )}
            {isInProgress && (
              <span className="text-[10px] text-white">...</span>
            )}
          </div>
          <span className="text-navy mt-0 text-sm">{section.title}</span>
        </div>
        <div className="ml-1 flex items-center">
          {opened ? (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-navy shrink-0"
              aria-hidden
            >
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          ) : (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-navy shrink-0"
              aria-hidden
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          )}
        </div>
      </div>

      {opened && (
        <div
          className="border-neu25 bg-neu25 cursor-default border-t pt-2.5 pr-5 pb-4 pl-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {section.minRequirementCount < section.requirements.length && (
            <p className="text-neu7 text-sm italic">
              Complete {section.minRequirementCount} of the following:
            </p>
          )}
          {section.requirements.map((requirement, index) => (
            <SectionRequirement
              key={index}
              requirement={requirement}
              dndIdPrefix={dndIdPrefix ? `${dndIdPrefix}-r${index}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SidebarSection;
