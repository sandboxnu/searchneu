"use client";

import React, { useState, useMemo } from "react";
import { Sidebar } from "../../components/graduate/Sidebar";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";

const DEFAULT_CATALOG_YEAR = 2024;

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [selectedMajorName, setSelectedMajorName] = useState<string | null>(
    null,
  );

  const { catalogYear, majorNames } = useMemo(() => {
    const supported = data?.supportedMajors ?? {};
    const yearKey =
      Object.keys(supported)[0] ?? String(DEFAULT_CATALOG_YEAR);
    const majorsForYear = supported[yearKey] ?? {};
    return {
      catalogYear: parseInt(yearKey, 10) || DEFAULT_CATALOG_YEAR,
      majorNames: Object.keys(majorsForYear),
    };
  }, [data]);

  const effectiveMajorName =
    selectedMajorName && majorNames.includes(selectedMajorName)
      ? selectedMajorName
      : majorNames[0] ?? null;

  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* SIDEBAR */}
      <aside className="h-full w-80 shrink-0">
        <Sidebar
          catalogYear={catalogYear}
          majorName={effectiveMajorName}
          selectedPlan={{ id: "1", concentration: "Undecided" }}
          courseData={true}
        />
      </aside>

      <main className="h-full flex-1 overflow-y-auto p-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Graduate Programs</h1>
        </header>

        <div className="grid gap-4">
          {majorNames.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedMajorName(name)}
              className={`rounded-xl border p-5 text-left transition-all ${
                effectiveMajorName === name
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <h3 className="font-semibold">{name}</h3>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
