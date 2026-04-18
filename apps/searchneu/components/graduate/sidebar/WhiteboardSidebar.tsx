"use client";

import { Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Audit,
  Whiteboard,
  WhiteboardEntry,
  Section,
  Major,
  Minor,
} from "@/lib/graduate/types";
import {
  creditsInAudit,
  UNDECIDED_CONCENTRATION,
} from "@/lib/graduate/auditUtils";
import {
  collectScheduleCourses,
  buildWhiteboardFromSchedule,
} from "@/lib/graduate/requirementUtils";
import { SidebarContainer } from "./SidebarContainer";
import { WhiteboardSection } from "./WhiteboardSection";

export function WhiteboardSidebar({
  schedule,
  majors,
  minors,
  concentration,
  whiteboard,
  onWhiteboardChange,
}: {
  schedule: Audit;
  majors: Major[];
  minors: Minor[];
  concentration: string | null;
  whiteboard: Whiteboard;
  onWhiteboardChange: (updated: Whiteboard) => void;
}) {
  const currentMajor = majors?.[0] ?? null;
  const currentMinor = minors?.[0] ?? null;
  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");
  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;
  const creditsToTake = currentMajor?.totalCreditsRequired ?? 0;
  const creditsTaken = creditsInAudit(schedule);
  const scheduleCourses = collectScheduleCourses(schedule);
  const planCourses = useMemo(
    () => new Set(scheduleCourses.map((c) => `${c.subject} ${c.classId}`)),
    [scheduleCourses],
  );

  if (!schedule) {
    return (
      <SidebarContainer
        headerContent={
          <div className="px-4 pt-8 pb-4">
            <h1 className="text-navy text-2xl font-bold">
              Failed to load major
            </h1>
          </div>
        }
      >
        <div className="px-4 py-8 text-center">
          <span className="text-neu6 text-xs">
            Schedule data is unavailable
          </span>
        </div>
      </SidebarContainer>
    );
  }

  const sections =
    activeTab === "major"
      ? currentMajor?.requirementSections
      : (currentMinor?.requirementSections ?? []);

  const defaultEntry: WhiteboardEntry = {
    courses: [],
    status: "not_started",
  };

  function handleSectionUpdate(sectionTitle: string, entry: WhiteboardEntry) {
    onWhiteboardChange({ ...whiteboard, [sectionTitle]: entry });
  }

  function handleAutoFill() {
    const allSections = [
      ...(currentMajor?.requirementSections ?? []),
      ...(currentMinor?.requirementSections ?? []),
    ];
    onWhiteboardChange(
      buildWhiteboardFromSchedule(allSections, schedule, whiteboard),
    );
  }

  return (
    <SidebarContainer
      headerContent={
        <div className="shrink-0 px-4 pt-8 pb-4">
          <div className="pb-2">
            <h1 className="text-navy text-2xl font-bold">
              {currentMajor ? currentMajor.name : "No major"}
            </h1>
            {subtitle && (
              <p
                className={`text-sm ${isUndecided ? "text-red italic" : "text-navy"}`}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-navy text-2xl font-bold">
              {creditsTaken}/{creditsToTake}
            </span>
            <span className="text-navy">Credits Completed</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-1 flex-col overflow-y-auto">
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

            <div className="border-neu25 border-b px-4 py-3">
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-blue hover:bg-blue/10 flex w-full items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto-fill from schedule
              </button>
              <p className="text-neu6 mt-1 text-center text-xs">
                Automatically assigns schedule courses to matching sections.
              </p>
            </div>

            {activeTab === "minor" && currentMinor && (
              <h3 className="text-navy px-4 py-4 text-base font-semibold">
                Minor Requirements
              </h3>
            )}

            {sections?.map((section: Section, index: number) => (
              <WhiteboardSection
                key={`${section.title}-${index}`}
                section={section}
                entry={whiteboard[section.title] ?? defaultEntry}
                scheduleCourses={scheduleCourses}
                onUpdate={(entry) => handleSectionUpdate(section.title, entry)}
                defaultOpen={index === 0}
                planCourses={planCourses}
              />
            ))}

            {!sections && (
              <p className="text-neu6 px-4 py-3 text-sm italic">
                No requirement sections
              </p>
            )}
          </div>
        </div>
      </div>
    </SidebarContainer>
  );
}
