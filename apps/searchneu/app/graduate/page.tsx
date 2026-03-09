"use client";

import { useState, useEffect } from "react";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import EditPlanModal from "@/components/graduate/modal/EditPlanModal";

type PlanInfo = {
  id: number;
  name: string;
  majors?: string[] | null;
  minors?: string[] | null;
  catalogYear?: number | null;
  concentration?: string | null;
};

export default function Page() {
  const [planToEdit, setPlanToEdit] = useState<PlanInfo | undefined>();

  const fetchPlanById = async (id: number) => {
    try {
      const res = await fetch(`/api/audit/plan/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const plan: PlanInfo = await res.json();
        setPlanToEdit(plan);
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <NewPlanModal
        onPlanCreated={(plan) => fetchPlanById(plan.id)}
      />

      {planToEdit && (
        <EditPlanModal
          plan={planToEdit}
          onPlanUpdated={() => fetchPlanById(planToEdit.id)}
        />
      )}
    </div>
  );
}