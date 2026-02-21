// plan client + sidebar client + header bar utils = homepage!!
"use client";

import { useState } from "react";
import { PlanDndWrapper } from "@/components/graduate/dnd/AuditDndWrapper";
import { preparePlanForDnd, cleanDndIdsFromPlan } from "./dnd/planDndUtils";
import { Audit } from "@/lib/graduate/types";
import { toast } from "sonner";

interface Props {
  initialPlan: Audit<null>;  
  planId: number;
  catalogYear: number;
}

export function PlanClient({ initialPlan, planId }: Props) {
  const [plan, setPlan] = useState(() => preparePlanForDnd(initialPlan));
  const handlePlanUpdate = async (updatedPlan: Audit<string>) => {
    setPlan(updatedPlan);
    const cleaned = cleanDndIdsFromPlan(updatedPlan);
    // await save plan
    const res = await fetch(
      `api/audit/plan/${planId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(cleaned)
      }
    );

    if(!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "failed to update plan")
    }
  };


  return (
    <PlanDndWrapper
      plan={plan}
      catalogYear={plan.years[0].year}
      onPlanUpdate={handlePlanUpdate}
      onError={(msg) => toast.error(msg)}
    />
  );
}