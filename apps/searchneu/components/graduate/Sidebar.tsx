import React, { useState } from "react";
import { Major, Minor, type Section } from "../../lib/graduate/types";
import { useMajor } from "../../lib/graduate/useGraduateApi";

export enum SidebarValidationStatus {
  Loading = "Loading",
  Error = "Error",
  Complete = "Complete",
  InProgress = "InProgress",
}

const UNDECIDED_CONCENTRATION = "Concentration Undecided";

interface SidebarProps {
  /** When provided, Sidebar fetches major data via useMajor. Prefer this over passing currentMajor. */
  catalogYear?: number;
  /** When provided with catalogYear, Sidebar fetches this major's data. */
  majorName?: string | null;
  /** Optional preloaded major (e.g. from parent). If catalogYear + majorName are provided, useMajor takes precedence. */
  currentMajor?: Major;
  selectedPlan?: { id: string; concentration: string };
  courseData?: boolean;
  creditsTaken?: number;
  isSharedPlan?: boolean;
  isCoursesLoading?: boolean;
  isMajorLoading?: boolean;
  majorError?: Error | null;
  coursesTaken?: unknown[];
  currentMinor?: Minor;
  majors?: Major[];
  currentMajorIndex?: number;
  handlePrevMajor?: () => void;
  handleNextMajor?: () => void;
  minors?: Minor[];
  currentMinorIndex?: number;
  handlePrevMinor?: () => void;
  handleNextMinor?: () => void;
  validationStatus?: any;
  getSectionErrorByType?: any;
  getSidebarValidationStatus?: any;
  concentration?: any;
  concentrationValidationStatus?: any;
}

/** Collapsible section row matching graduatenu SidebarSection / NUPathSection look */
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  status = SidebarValidationStatus.Complete,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  status?: SidebarValidationStatus;
}) {
  const [opened, setOpened] = useState(defaultOpen);
  const isComplete = status === SidebarValidationStatus.Complete;
  const isError = status === SidebarValidationStatus.Error;
  const isInProgress = status === SidebarValidationStatus.InProgress;
  const isLoading = status === SidebarValidationStatus.Loading;

  return (
    <div
      className="border-t border-neutral-200 cursor-pointer select-none transition-[background-color] duration-150 ease-out"
      onClick={() => setOpened(!opened)}
    >
      <div
        className="flex flex-row justify-between items-start font-bold py-4 px-4 m-0 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 sticky top-0 z-10 transition-colors duration-150 ease-out"
        style={{ transitionDelay: "0.1s" }}
      >
        <div className="flex flex-row h-full gap-2">
          {/* Status circle - same as SidebarSection/NUPathSection */}
          <div
            className={`
              w-[18px] h-[18px] min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full border mt-0.5
              transition-[background-color,border-color,color] duration-150 ease-out
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
          <span className="text-sm text-blue-900 mt-0">{title}</span>
        </div>
        <div className="ml-1 flex items-center">
          {opened ? (
            <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900 shrink-0">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          ) : (
            <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900 shrink-0">
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
          {children}
        </div>
      )}
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = React.memo((props) => {
  const {
    catalogYear,
    majorName,
    currentMajor: currentMajorProp,
    selectedPlan,
    courseData,
    currentMinor,
    isMajorLoading: isMajorLoadingProp,
    majorError: majorErrorProp,
  } = props;

  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");

  const useHook =
    catalogYear != null && majorName != null && majorName.length > 0;
  const { data: majorFromHook, error: majorErrorFromHook, loading: majorLoadingFromHook } = useMajor(
    catalogYear ?? 0,
    useHook ? majorName : null,
  );

  const currentMajor = useHook ? majorFromHook ?? undefined : currentMajorProp;
  const majorError = useHook ? majorErrorFromHook : majorErrorProp;
  const isMajorLoading = useHook ? majorLoadingFromHook : isMajorLoadingProp;

  // ERROR STATE
  if (majorError) {
    return (
      <div className="flex min-h-full w-full items-center justify-center border-r border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-red-600">
            Failed to load major
          </span>
          <span className="text-xs text-neutral-500">{majorError.message}</span>
        </div>
      </div>
    );
  }

  // LOADING GUARD
  if (!currentMajor || !selectedPlan || isMajorLoading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center border-r border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600" />
          <span className="text-sm font-medium text-neutral-500">
            Loading requirement data...
          </span>
        </div>
      </div>
    );
  }

  const subtitle =
    selectedPlan.concentration === "Undecided"
      ? UNDECIDED_CONCENTRATION
      : selectedPlan.concentration;
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;
  const creditsToTake = currentMajor.totalCreditsRequired ?? 128;
  const creditsTaken = props.creditsTaken ?? 0;
  const renderBetaMajorBlock = currentMajor.metadata?.verified !== true;

  return (
    <div className="flex min-h-full w-full flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50 pt-8">
      {/* Header block - SidebarContainer style */}
      <div className="px-4 pb-4">
        {renderBetaMajorBlock && (
          <div className="flex items-center pb-3">
            <span className="rounded-md border border-red-500 px-2 py-0.5 text-sm font-bold text-red-600">
              BETA MAJOR
            </span>
          </div>
        )}
        <div className="pb-3">
          <h1 className="text-2xl font-bold text-blue-900">{currentMajor.name}</h1>
          {subtitle && (
            <p
              className={`text-sm ${isUndecided ? "text-red-500 italic" : "text-blue-900"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-900">
            {creditsTaken}
            {creditsToTake != null ? `/${creditsToTake}` : ""}
          </span>
          <span className="text-blue-900">Credits Completed</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {courseData && (
          <>
            {/* GenericSection-style placeholder */}
            <CollapsibleSection title="General Requirements" defaultOpen={false}>
              <p className="text-sm italic text-neutral-600">
                Course requirements will appear here.
              </p>
            </CollapsibleSection>

            {/* NUPathSection-style placeholder */}
            <CollapsibleSection title="NUpath Requirements" defaultOpen={false}>
              <p className="text-sm italic text-neutral-600 pl-1 pt-1">
                Complete the following NUpath requirements:
              </p>
            </CollapsibleSection>

            {/* Tabs - same as original: enclosed, blue.800 selected, neutral.50 bg */}
            <div className="pt-3 bg-neutral-50">
              <div className="flex gap-2 border-b-2 border-neutral-200 px-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("major")}
                  className={`flex-[0.4] rounded-t-lg py-1 px-1 text-xs font-bold uppercase transition-all ${
                    activeTab === "major"
                      ? "bg-blue-800 text-white shadow-md"
                      : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                  }`}
                >
                  MAJOR
                </button>
                {currentMinor && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("minor")}
                    className={`flex-[0.4] rounded-t-lg py-1 px-1 text-xs font-bold uppercase transition-all ${
                      activeTab === "minor"
                        ? "bg-blue-800 text-white shadow-md"
                        : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                    }`}
                  >
                    MINOR
                  </button>
                )}
              </div>

              {/* Tab panel - RequirementTabPanel style: blue.50 strip, then sections */}
              <div className="w-full p-0 m-0">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-neutral-200">
                  <div className="flex-1" />
                  <h2 className="text-base font-semibold text-blue-900 text-center flex-1">
                    {activeTab === "major"
                      ? currentMajor.name
                      : currentMinor?.name ?? "Minor"}
                  </h2>
                  <div className="flex-1" />
                </div>

                {activeTab === "minor" && currentMinor && (
                  <h3 className="text-base font-semibold text-blue-900 py-4 px-4">
                    Minor Requirements
                  </h3>
                )}

                {/* Requirement sections - SidebarSection style */}
                {(activeTab === "major"
                  ? currentMajor.requirementSections
                  : currentMinor?.requirementSections ?? []
                ).map((section: Section, index: number) => (
                  <CollapsibleSection
                    key={section.title ?? index}
                    title={section.title}
                    defaultOpen={index === 0}
                  >
                    {section.minRequirementCount < section.requirements.length && (
                      <p className="text-sm italic text-neutral-700">
                        Complete {section.minRequirementCount} of the
                        following:
                      </p>
                    )}
                    <p className="text-sm text-neutral-600 pl-1 pt-1">
                      Requirement details will appear here.
                    </p>
                  </CollapsibleSection>
                ))}

                {activeTab === "major" &&
                  (!currentMajor.requirementSections?.length) && (
                    <p className="px-4 py-3 text-sm italic text-neutral-500">
                      No requirement sections
                    </p>
                  )}
                {activeTab === "minor" &&
                  !currentMinor?.requirementSections?.length && (
                    <p className="px-4 py-3 text-sm italic text-neutral-500">
                      No requirement sections
                    </p>
                  )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

interface NoMajorSidebarProps {
  selectedPlan?: { id: string; concentration: string };
  transferCourses?: unknown;
}

export const NoMajorSidebar: React.FC<NoMajorSidebarProps> = ({
  selectedPlan,
  transferCourses,
}) => {
  return (
    <div className="flex min-h-full w-full flex-col border-r border-neutral-200 bg-neutral-50 pt-8">
      <div className="px-4 pb-4">
        <h1 className="text-2xl font-bold text-blue-900">No Major</h1>
      </div>
      <div className="space-y-4 px-4 pb-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          A major has not been selected for this plan. Please select one if you
          would like to see major requirements. If we do not support your major,
          you can{" "}
          <a
            href="https://forms.gle/o5AHSuFSwDJREEPp7"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-700 underline hover:text-blue-900"
          >
            request it here
          </a>
          .
        </p>
        <p className="text-sm text-neutral-600">
          Use the &ldquo;Add Course&rdquo; button in the schedule to add a course
          to a semester.
        </p>
      </div>
    </div>
  );
};

export const NoPlanSidebar: React.FC = () => {
  return (
    <div className="flex min-h-full items-center justify-center border-r border-neutral-200 bg-neutral-50 p-4 text-center">
      <p className="text-sm font-bold tracking-widest uppercase text-neutral-400">
        No Plan Selected
      </p>
    </div>
  );
};

Sidebar.displayName = "Sidebar";
