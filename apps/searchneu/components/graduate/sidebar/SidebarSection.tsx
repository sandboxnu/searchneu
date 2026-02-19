import React, { useState } from "react";
import type { Section } from "../../../lib/graduate/types";
import { SidebarValidationStatus } from "../../../lib/graduate/types";
import SectionRequirement from "./SectionRequirement";    

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
const SidebarSection: React.FC<SidebarSectionProps> = ({
  section,
  validationStatus = SidebarValidationStatus.Complete,
  defaultOpen = false,
  dndIdPrefix,
}) => {
  const [opened, setOpened] = useState(defaultOpen);

  const isComplete = validationStatus === SidebarValidationStatus.Complete;
  const isError = validationStatus === SidebarValidationStatus.Error;
  const isInProgress = validationStatus === SidebarValidationStatus.InProgress;
  const isLoading = validationStatus === SidebarValidationStatus.Loading;

  return (
    <div
      className="border-t border-neutral-200 cursor-pointer select-none transition-[background-color] duration-[0.25s] ease-out"
      onClick={() => setOpened(!opened)}
    >
      <div
        className="flex flex-row justify-between items-start font-bold py-4 px-4 m-0 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 sticky top-0 z-10 transition-[background-color,border-color,color] duration-[0.25s] ease-out"
        style={{ transitionDelay: "0.1s" }}
      >
        <div className="flex flex-row h-full gap-2">
          {/* Status circle - matches graduatenu SidebarSection */}
          <div
            className={`
              w-[18px] h-[18px] min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full border mt-0.5
              transition-[background-color,border-color,color] duration-[0.25s] ease-out
              ${isComplete ? "bg-emerald-600 border-emerald-600 text-white" : ""}
              ${isError ? "bg-neutral-400 border-neutral-400 text-white" : ""}
              ${isInProgress ? "bg-orange-500 border-orange-500 text-white" : ""}
              ${isLoading ? "bg-transparent border-neutral-400 text-neutral-400" : ""}
            `}
          >
            {isComplete && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isError && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 0 0-1.41 1.41L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.88a.996.996 0 1 0 1.41-1.41L13.41 12l4.88-4.89z" />
              </svg>
            )}
            {isLoading && (
              <div className="w-2.5 h-2.5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
            )}
            {isInProgress && <span className="text-[10px] text-white">...</span>}
          </div>
          <span className="text-sm text-blue-900 mt-0">{section.title}</span>
        </div>
        <div className="ml-1 flex items-center">
          {opened ? (
            <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900 shrink-0" aria-hidden>
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          ) : (
            <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900 shrink-0" aria-hidden>
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          )}
        </div>
      </div>

      {opened && (
        <div
          className="bg-neutral-100 border-t border-neutral-200 pt-2.5 pr-5 pb-4 pl-2.5 cursor-default"
          style={{ borderTopWidth: "0.5px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {section.minRequirementCount < section.requirements.length && (
            <p className="text-sm italic text-neutral-700">
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
};

export default SidebarSection;
