import React, { useState } from "react";
import { Major, Minor, Section, SidebarValidationStatus } from "../../../lib/graduate/types";
import { useGraduateMajor } from "../../../lib/graduate/useGraduateApi";
import SidebarContainer from "./SidebarContainer";
import SidebarSection from "./SidebarSection";


export { SidebarValidationStatus };

const UNDECIDED_CONCENTRATION = "Concentration Undecided";

interface SidebarProps {
  catalogYear?: number;
  majorName?: string | null;
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
  validationStatus?: unknown;
  getSectionErrorByType?: unknown;
  getSidebarValidationStatus?: unknown;
  concentration?: unknown;
  concentrationValidationStatus?: unknown;
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
  const { majorData: majorFromHook, error: majorErrorFromHook, loading: majorLoadingFromHook } = useGraduateMajor(
    useHook && catalogYear != null ? String(catalogYear) : null,
    useHook ? majorName : null,
  );

  const currentMajor = useHook ? majorFromHook ?? undefined : currentMajorProp;
  const majorError = useHook ? majorErrorFromHook : majorErrorProp;
  const isMajorLoading = useHook ? majorLoadingFromHook : isMajorLoadingProp;

  // ERROR STATE
  if (majorError) {
    return (
      <SidebarContainer title="Failed to load major">
        <div className="px-4 py-8 text-center">
          <span className="text-xs text-neutral-500">{majorError.message}</span>
        </div>
      </SidebarContainer>
    );
  }

  // LOADING GUARD
  if (!currentMajor || !selectedPlan || isMajorLoading) {
    return (
      <SidebarContainer title="Loading...">
        <div className="flex min-h-full w-full items-center justify-center p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600" />
            <span className="text-sm font-medium text-neutral-500">
              Loading requirement data...
            </span>
          </div>
        </div>
      </SidebarContainer>
    );
  }

  const subtitle =
    selectedPlan.concentration === "Undecided"
      ? UNDECIDED_CONCENTRATION
      : selectedPlan.concentration;
  const creditsToTake = currentMajor.totalCreditsRequired ?? 128;
  const creditsTaken = props.creditsTaken ?? 0;
  const renderBetaMajorBlock = currentMajor.metadata?.verified !== true;

  const sections =
    activeTab === "major"
      ? currentMajor.requirementSections
      : currentMinor?.requirementSections ?? [];

  return (
    <SidebarContainer
      title={currentMajor.name}
      subtitle={subtitle}
      creditsTaken={creditsTaken}
      creditsToTake={creditsToTake}
      renderBetaMajorBlock={renderBetaMajorBlock}
    >
      <div className="flex-1 overflow-y-auto flex flex-col">
        {courseData && (
          <>
            {/* Tabs - enclosed, blue.800 selected, neutral.50 bg (matches graduatenu) */}
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

              {/* Tab panel - RequirementTabPanel style: blue.50 strip, then SidebarSections */}
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

                {sections.map((section: Section, index: number) => (
                  <SidebarSection
                    key={index}
                    section={section}
                    validationStatus={SidebarValidationStatus.Complete}
                    defaultOpen={index === 0}
                    dndIdPrefix={`s${index}`}
                  />
                ))}

                {!sections.length && (
                  <p className="px-4 py-3 text-sm italic text-neutral-500">
                    No requirement sections
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarContainer>
  );
});

interface NoMajorSidebarProps {
  selectedPlan?: { id: string; concentration: string };
  transferCourses?: unknown;
}

export const NoMajorSidebar: React.FC<NoMajorSidebarProps> = () => {
  return (
    <SidebarContainer title="No Major">
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
    </SidebarContainer>
  );
};

export const NoPlanSidebar: React.FC = () => {
  return <SidebarContainer title="No Plan Selected" />;
};

Sidebar.displayName = "Sidebar";
