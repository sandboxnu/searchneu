"use client";

import React, { useState } from "react";
import { Sidebar } from "../../components/graduate/Sidebar";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";
// Import your types
import { Major, SupportedMajorsForYear } from "../../lib/graduate/types";

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [selectedMajorName, setSelectedMajorName] = useState<string | null>(
    null,
  );

  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  const majorsList: Major[] = Object.entries(data.supportedMajors || {}).map(
    ([name, details]: [string, any]) => ({
      name,
      requirementSections: details.requirementSections || [],
      totalCreditsRequired: details.totalCreditsRequired || 128,
      yearVersion: 2024,
      metadata: details.metadata,
      ...details,
    }),
  );

  const activeMajor =
    majorsList.find((m) => m.name === selectedMajorName) || majorsList[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* SIDEBAR */}
      <aside className="h-full w-80 flex-shrink-0">
        <Sidebar
          currentMajor={activeMajor}
          selectedPlan={{ id: "1", concentration: "Undecided" }}
          courseData={true}
        />
      </aside>

      <main className="h-full flex-1 overflow-y-auto p-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Graduate Programs</h1>
        </header>

        <div className="grid gap-4">
          {majorsList.map((major) => (
            <button
              key={major.name}
              onClick={() => setSelectedMajorName(major.name)}
              className={`rounded-xl border p-5 text-left transition-all ${
                activeMajor?.name === major.name
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <h3 className="font-semibold">{major.name}</h3>
              <p className="text-sm text-slate-500">
                {major.totalCreditsRequired} Credits Required
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
