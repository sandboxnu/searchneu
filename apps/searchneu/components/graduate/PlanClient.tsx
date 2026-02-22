"use client";

import { useState } from "react";
import { PlanDndWrapper } from "@/components/graduate/dnd/AuditDndWrapper";
import { preparePlanForDnd, cleanDndIdsFromPlan } from "./dnd/planDndUtils";
import { Audit } from "@/lib/graduate/types";
import { toast } from "sonner";
import { Sidebar } from "@/components/graduate/sidebar/Sidebar";
import EditPlanModal, { PlanMetadata } from "./modal/EditPlanModal";

interface Props {
  initialPlan: {
    schedule: Audit<null>;
    majors: string[];
    minors: string[];
    catalogYear: number;
    concentration: string;
    name: string;
  };
  planId: number;
  catalogYear: number;
  majorName?: string | null;
}

export function PlanClient({
  initialPlan,
  planId,
  catalogYear,
  majorName,
}: Props) {
  const [plan, setPlan] = useState(() => preparePlanForDnd(initialPlan.schedule));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planMeta, setPlanMeta] = useState<PlanMetadata>({
    id: planId,
    name: initialPlan.name,
    majors: initialPlan.majors,
    minors: initialPlan.minors,
    catalogYear: initialPlan.catalogYear,
    concentration: initialPlan.concentration,
  });

  const handlePlanUpdate = async (updatedPlan: Audit<string>) => {
    const cleaned = cleanDndIdsFromPlan(updatedPlan);
    const prepared = preparePlanForDnd(cleaned);
    setPlan(prepared);

    const res = await fetch(`/api/audit/plan/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ schedule: cleaned }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "failed to update plan");
    }
  };

  const sidebarNode = (
    <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl bg-blue-800 p-10"
        >
          click me
        </button>
        <EditPlanModal
          plan={planMeta}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPlanUpdated={(updated) => setPlanMeta(updated)}
        />
    <Sidebar
      catalogYear={planMeta.catalogYear ?? catalogYear}
      majorName={planMeta.majors?.[0] ?? majorName}
      selectedPlan={{ id: String(planId), concentration: planMeta.concentration || "Undecided" }}
      courseData={true}
    />
</>
  );

  return (
    <PlanDndWrapper
      plan={plan}
      catalogYear={catalogYear}
      onPlanUpdate={handlePlanUpdate}
      onError={(msg) => toast.error(msg)}
      sidebar={sidebarNode}
    />
  );
}
