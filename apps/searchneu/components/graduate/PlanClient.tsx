"use client";

import { useState } from "react";
import { PlanDndWrapper } from "@/components/graduate/dnd/AuditDndWrapper";
import { prepareAuditForDnd, cleanDndIdsFromPlan } from "./dnd/planDndUtils";
import { Audit, Major, Minor } from "@/lib/graduate/types";
import { toast } from "sonner";
import { Sidebar } from "@/components/graduate/sidebar/Sidebar";

export interface ClientAuditPlan {
  name: string;
  catalogYear: number;
  concentration: string;
  id: number;
  updatedAt: Date;
  createdAt: Date;
  userId: string;
  schedule: Audit<null>;
  majors: Major[] | null;
  minors: Minor[] | null;
}

export function PlanClient({ plan }: { plan: ClientAuditPlan }) {
  const [scheduleState, setScheduleState] = useState(() =>
    prepareAuditForDnd(plan.schedule),
  );
  const handlePlanUpdate = async (updatedPlan: Audit<string>) => {
    const cleaned = cleanDndIdsFromPlan(updatedPlan);
    const prepared = prepareAuditForDnd(cleaned);
    setScheduleState(prepared);
    const res = await fetch(`/api/audit/plan/${plan.id}`, {
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

  const sidebarNode = <Sidebar auditPlan={plan} />;

  return (
    <PlanDndWrapper
      plan={scheduleState}
      catalogYear={plan.catalogYear}
      onPlanUpdate={handlePlanUpdate}
      onError={(msg) => toast.error(msg)}
      sidebar={sidebarNode}
    />
  );
}
