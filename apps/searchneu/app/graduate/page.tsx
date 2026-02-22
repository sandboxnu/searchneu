"use client";

import { useState } from "react";
import { useSupportedMajors } from "@/lib/graduate/useGraduateApi";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import { useMemo } from "react";
import { Sidebar } from "../../components/graduate/sidebar/Sidebar";
import { PlanDndWrapper } from "../../components/graduate/dnd/AuditDndWrapper";
import type { Audit } from "../../lib/graduate/types";


export default function Page() {
  //const [selectedMajorName, setSelectedMajorName] = useState<string | null>(null);
  // TODO: replace null with a real plan once plan creation is wired up
  const plan: Audit<string> | null = null;
  const { data, error } = useSupportedMajors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<
    number | undefined | null
  >();
const DEFAULT_CATALOG_YEAR = 2024;

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
      <main className="flex flex-1 flex-col overflow-hidden bg-neutral-100">
      {/* Sidebar always rendered */}
      <aside className="h-full w-80 shrink-0 border-r border-neutral-200">
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-2xl bg-red-800 p-10"
      >
        click me
      </button>
      <NewPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        setSelectedPlanId={setSelectedPlanId}
      ></NewPlanModal>
        {sidebar}
      </aside>

      {/* Main content */}
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
  );
}
