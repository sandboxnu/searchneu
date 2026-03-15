"use client";
import { useState } from "react";
import {
  HydratedAuditPlan,
  Section,
  SidebarValidationStatus,
} from "@/lib/graduate/types";
import SidebarContainer from "./SidebarContainer";
import SidebarSection from "./SidebarSection";
import { creditsInAudit } from "@/lib/graduate/auditUtils";

export { SidebarValidationStatus };

const UNDECIDED_CONCENTRATION = "Concentration Undecided";

export function Sidebar({
  schedule,
  majors,
  minors,
  concentration,
}: HydratedAuditPlan<null>) {
  //const { schedule, majors, minors, concentration } = props.auditPlan;
  const currentMajor = majors == null ? null : majors[0];
  const currentMinor = minors == null ? null : minors[0];

  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");

  // ERROR STATE
  if (schedule == null) {
    return (
      <SidebarContainer title="Failed to load major">
        <div className="px-4 py-8 text-center">
          <span className="text-neu6 text-xs">schedule is null 😭</span>
        </div>
      </SidebarContainer>
    );
  }

  // LOADING GUARD
  if (!schedule) {
    return (
      <SidebarContainer title="Loading...">
        <div className="flex min-h-full w-full items-center justify-center p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="border-neu4 border-t-blue h-8 w-8 animate-spin rounded-full border-4" />
            <span className="text-neu6 text-sm font-medium">
              Loading requirement data...
            </span>
          </div>
        </div>
      </SidebarContainer>
    );
  }

  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const creditsToTake = currentMajor?.totalCreditsRequired ?? 0;
  const creditsTaken = creditsInAudit<null>(schedule ?? []) ?? 0;

  const sections =
    activeTab === "major"
      ? currentMajor?.requirementSections
      : (currentMinor?.requirementSections ?? []);

  return (
    <SidebarContainer
      title={currentMajor ? currentMajor.name : "No major"}
      subtitle={subtitle}
      creditsTaken={creditsTaken}
      creditsToTake={creditsToTake}
    >
      <div className="flex flex-1 flex-col overflow-y-auto">
        {
          <>
            {/* Tabs - enclosed, blue.800 selected, neutral.50 bg (matches graduatenu) */}
            <div className="bg-neu2 pt-3">
              <div className="border-neu25 flex gap-2 border-b-2 px-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("major")}
                  className={`flex-[0.4] rounded-t-lg px-1 py-1 text-xs font-bold uppercase transition-all ${
                    activeTab === "major"
                      ? "bg-navy text-white shadow-md"
                      : "bg-neu3 text-neu6 hover:bg-neu4"
                  }`}
                >
                  MAJOR
                </button>
                {currentMinor && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("minor")}
                    className={`flex-[0.4] rounded-t-lg px-1 py-1 text-xs font-bold uppercase transition-all ${
                      activeTab === "minor"
                        ? "bg-navy text-white shadow-md"
                        : "bg-neu3 text-neu6 hover:bg-neu4"
                    }`}
                  >
                    MINOR
                  </button>
                )}
              </div>

              {/* Tab panel - RequirementTabPanel style: blue.50 strip, then SidebarSections */}
              <div className="m-0 w-full p-0">
                <div className="border-neu25 bg-blue/10 flex items-center justify-between border-b px-4 py-3">
                  <div className="flex-1" />
                  <h2 className="text-navy flex-1 text-center text-base font-semibold">
                    {activeTab === "major"
                      ? currentMajor
                        ? currentMajor.name
                        : "No Major"
                      : (currentMinor?.name ?? "Minor")}
                  </h2>
                  <div className="flex-1" />
                </div>

                {activeTab === "minor" && currentMinor && (
                  <h3 className="text-navy px-4 py-4 text-base font-semibold">
                    Minor Requirements
                  </h3>
                )}

                {sections?.map((section: Section, index: number) => (
                  <SidebarSection
                    key={index}
                    section={section}
                    validationStatus={SidebarValidationStatus.Complete}
                    defaultOpen={index === 0}
                    dndIdPrefix={`s${index}`}
                  />
                ))}

                {!sections && (
                  <p className="text-neu6 px-4 py-3 text-sm italic">
                    No requirement sections
                  </p>
                )}
              </div>
            </div>
          </>
        }
      </div>
    </SidebarContainer>
  );
}

//interface NoMajorSidebarProps {
//selectedPlan?: { id: string; concentration: string };
//transferCourses?: unknown;
//}

export function NoMajorSidebar() {
  return (
    <SidebarContainer title="No Major">
      <div className="space-y-4 px-4 pb-4">
        <p className="text-neu7 text-sm leading-relaxed">
          A major has not been selected for this plan. Please select one if you
          would like to see major requirements. If we do not support your major,
          you can{" "}
          <a
            href="https://forms.gle/o5AHSuFSwDJREEPp7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue hover:text-navy font-bold underline"
          >
            request it here
          </a>
          .
        </p>
        <p className="text-neu6 text-sm">
          Use the &ldquo;Add Course&rdquo; button in the schedule to add a
          course to a semester.
        </p>
      </div>
    </SidebarContainer>
  );
}

export const NoPlanSidebar: React.FC = () => {
  return <SidebarContainer title="No Plan Selected" />;
};

Sidebar.displayName = "Sidebar";
