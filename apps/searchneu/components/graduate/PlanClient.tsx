"use client";

import { useState } from "react";
import { AuditDndWrapper } from "@/components/graduate/dnd/AuditDndWrapper";
import { prepareAuditForDnd, cleanDndIdsFromPlan } from "./dnd/planDndUtils";
import { Audit, HydratedAuditPlan } from "@/lib/graduate/types";
import { toast } from "sonner";
import { Sidebar } from "@/components/graduate/sidebar/Sidebar";
import { CourseNameContext } from "./CourseNameContext";

interface PlanClientProps {
  plan: HydratedAuditPlan<null>;
  courseNames: Record<string, string>;
}

export function PlanClient({ plan, courseNames }: PlanClientProps) {
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

  const sidebarNode = <Sidebar {...plan} />;

  return (
    <CourseNameContext.Provider value={courseNames}>
      <AuditDndWrapper
        plan={scheduleState}
        catalogYear={plan.catalogYear}
        onPlanUpdate={handlePlanUpdate}
        onError={(msg) => toast.error(msg)}
        sidebar={sidebarNode}
      />
    </CourseNameContext.Provider>
  );
}
