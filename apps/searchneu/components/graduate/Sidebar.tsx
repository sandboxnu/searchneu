import React, { useState } from "react";
// Import your existing types here (adjust the path to your actual types file)
import {
  Major,
  Minor,
  NUPathEnum,
  ScheduleCourse,
} from "../../lib/graduate/types";

export enum SidebarValidationStatus {
  Loading = "Loading",
  Error = "Error",
  Complete = "Complete",
  InProgress = "InProgress",
}

interface SidebarProps {
  currentMajor?: Major;
  selectedPlan?: { id: string; concentration: string };
  courseData?: any;
  creditsTaken?: number;
  isSharedPlan?: boolean;
  isCoursesLoading?: boolean;
  coursesTaken?: ScheduleCourse<string>[];
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

export const Sidebar: React.FC<SidebarProps> = React.memo((props) => {
  const {
    currentMajor,
    selectedPlan,
    courseData,
    currentMinor,
    // ... other props
  } = props;

  const [activeTab, setActiveTab] = useState<"major" | "minor">("major");

  // LOADING GUARD
  if (!currentMajor || !selectedPlan) {
    return (
      <div className="flex h-full w-full items-center justify-center border-r border-slate-200 bg-slate-50 p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
          <span className="text-sm font-medium text-slate-500">
            Loading requirement data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
      {/* HEADER SECTION */}
      <div className="border-b bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {currentMajor.name}
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {selectedPlan.concentration === "Undecided"
              ? "No Concentration"
              : selectedPlan.concentration}
          </span>
          {currentMajor.metadata?.verified && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
              VERIFIED
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {courseData && (
          <>
            {/* NEW COMPONENT PLACEHOLDERS */}
            <div className="border-b border-slate-200 bg-white p-2">
              <div className="rounded border border-dashed border-slate-200 p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  GenericSection Placeholder
                </p>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white p-2">
              <div className="rounded border border-dashed border-slate-200 p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  NUPathSection Placeholder
                </p>
              </div>
            </div>

            {/* TABS */}
            <div className="pt-3">
              <div className="flex gap-2 border-b-2 border-slate-200 px-4">
                <button
                  onClick={() => setActiveTab("major")}
                  className={`flex-1 rounded-t-lg py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                    activeTab === "major"
                      ? "bg-blue-800 text-white shadow-md"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  Major
                </button>

                {currentMinor && (
                  <button
                    onClick={() => setActiveTab("minor")}
                    className={`flex-1 rounded-t-lg py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                      activeTab === "minor"
                        ? "bg-blue-800 text-white shadow-md"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    Minor
                  </button>
                )}
              </div>

              <div className="p-4">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800">
                    {activeTab === "major"
                      ? "Major Requirements"
                      : "Minor Requirements"}
                  </h4>
                  <p className="mt-2 text-xs text-slate-400 italic">
                    Placeholder for RequirementTabPanel ({activeTab})
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export const NoMajorSidebar: React.FC<any> = ({
  selectedPlan,
  transferCourses,
}) => {
  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b p-4 text-lg font-bold text-slate-800">
        No Major Selected
      </div>
      <div className="space-y-4 px-4 py-6">
        <p className="text-sm leading-relaxed text-slate-600">
          A major has not been selected for this plan. Please select one if you
          would like to see major requirements.
        </p>
        <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            If we do not support your major, you can{" "}
            <a
              href="https://forms.gle/o5AHSuFSwDJREEPp7"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-800 underline hover:text-blue-900"
            >
              request it here
            </a>
            .
          </p>
        </div>
        <p className="text-xs text-slate-500 italic">
          Use the “Add Course” button in the schedule to add a course to a
          semester.
        </p>
      </div>
    </div>
  );
};

export const NoPlanSidebar: React.FC = () => {
  return (
    <div className="flex h-full items-center justify-center border-r border-slate-200 bg-slate-50 p-4 text-center">
      <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">
        No Plan Selected
      </p>
    </div>
  );
};

Sidebar.displayName = "Sidebar";
