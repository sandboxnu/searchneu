import React from "react";
import SidebarSection from "./SidebarSection";

export type RequirementType = "major" | "minor";

interface RequirementTabPanelProps {
  requirement: {
    name: string;
    requirementSections: any[];
  };
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  courseData: any;
  dndIdPrefix: string;
  isCoursesLoading: boolean;
  coursesTaken: any[];
  validationStatus: any;
  getSectionError: (
    requirementType: RequirementType,
    sectionIndex: number,
    status: any,
  // ) => MajorValidationError | undefined;
  ) => any;
  // getSidebarValidationStatus: (error?: MajorValidationError) => any;
  getSidebarValidationStatus: (error?: any) => any;
  requirementType: RequirementType;
  concentration?: any;
  concentrationValidationStatus?: any;
  isSharedPlan?: boolean;
}

export const RequirementTabPanel: React.FC<RequirementTabPanelProps> = ({
  requirement,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  courseData,
  dndIdPrefix,
  isCoursesLoading,
  coursesTaken,
  validationStatus,
  getSectionError,
  getSidebarValidationStatus,
  requirementType,
  concentration,
  concentrationValidationStatus,
  isSharedPlan,
}) => {
  const label = requirementType === "major" ? "Major" : "Minor";

  return (
    <div className="m-0 w-full p-0">
      {/* Header / Navigation Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-blue-50 px-4 py-3">
        <button
          aria-label={`Previous ${label.toLowerCase()}`}
          onClick={onPrevious}
          disabled={totalCount <= 1}
          className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <h2 className="text-md flex-1 text-center font-semibold text-blue-900">
          {requirement.name}
          {totalCount > 1 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({currentIndex + 1}/{totalCount})
            </span>
          )}
        </h2>

        <button
          aria-label={`Next ${label.toLowerCase()}`}
          onClick={onNext}
          disabled={totalCount <= 1}
          className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      {/* Requirement Label (Only for Minors) */}
      {requirementType === "minor" && (
        <div className="flex">
          <h2 className="text-md px-4 py-4 font-semibold text-blue-900">
            {label} Requirements
          </h2>
        </div>
      )}

      {/* Main Requirement Sections */}
      {requirement.requirementSections.map((section, index) => {
        const sectionValidationError = getSectionError(
          requirementType,
          index,
          validationStatus,
        );
        const sectionValidationStatus = getSidebarValidationStatus(
          sectionValidationError,
        );

        return (
          <SidebarSection
            key={section.title || index}
            section={section}
            validationStatus={sectionValidationStatus}
            courseData={courseData}
            dndIdPrefix={`${dndIdPrefix}-${index}`}
            loading={isCoursesLoading}
            coursesTaken={coursesTaken}
            isSharedPlan={isSharedPlan}
          />
        );
      })}

      {/* Concentration Section */}
      {concentration && (
        <SidebarSection
          validationStatus={concentrationValidationStatus}
          section={concentration}
          courseData={courseData}
          dndIdPrefix={`${dndIdPrefix}-concentration`}
          loading={isCoursesLoading}
          coursesTaken={coursesTaken}
        />
      )}
    </div>
  );
};
