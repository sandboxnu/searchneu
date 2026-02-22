"use client";

import { useMemo } from "react";
import { Sidebar } from "../../components/graduate/sidebar/Sidebar";
import { PlanDndWrapper } from "../../components/graduate/dnd/AuditDndWrapper";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";
import type { Audit } from "../../lib/graduate/types";

const DEFAULT_CATALOG_YEAR = 2024;

export default function Page() {
  const { data, error } = useSupportedMajors();
  //const [selectedMajorName, setSelectedMajorName] = useState<string | null>(null);

  // TODO: replace null with a real plan once plan creation is wired up
  const plan: Audit<string> | null = null;

  const { catalogYear, majorNames } = useMemo(() => {
    const supported = data?.supportedMajors ?? {};
    const yearKey = Object.keys(supported)[0] ?? String(DEFAULT_CATALOG_YEAR);
    const majorsForYear = supported[yearKey] ?? {};
    return {
      catalogYear: parseInt(yearKey, 10) || DEFAULT_CATALOG_YEAR,
      majorNames: Object.keys(majorsForYear),
    };
  }, [data]);

  const effectiveMajorName = majorNames[0] ?? "NO EFFECTIVE MAJOR";

  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  const sidebar = (
    <Sidebar
      catalogYear={catalogYear}
      majorName={effectiveMajorName}
      selectedPlan={{ id: "1", concentration: "Undecided" }}
      courseData={true}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar always rendered */}
      <aside className="h-full w-80 shrink-0 border-r border-neutral-200">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-neutral-100">
        {plan ? (
          <PlanDndWrapper
            plan={plan}
            catalogYear={catalogYear}
            onPlanUpdate={() => {}}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
            <p className="text-lg font-medium">No plan yet</p>
            <p className="text-sm">Create a plan to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
