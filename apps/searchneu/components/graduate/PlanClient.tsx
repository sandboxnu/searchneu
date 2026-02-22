"use client";

import { useState } from "react";
import { PlanDndWrapper } from "@/components/graduate/dnd/AuditDndWrapper";
import { preparePlanForDnd, cleanDndIdsFromPlan } from "./dnd/planDndUtils";
import { Audit } from "@/lib/graduate/types";
import { toast } from "sonner";
import { Sidebar } from "@/components/graduate/sidebar/Sidebar";

interface Props {
  initialPlan: Audit<null>;
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
  const [plan, setPlan] = useState(() => preparePlanForDnd(initialPlan));

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
    <Sidebar
      catalogYear={catalogYear}
      majorName={majorName}
      selectedPlan={{ id: String(planId), concentration: "Undecided" }}
      courseData={true}
    />
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
