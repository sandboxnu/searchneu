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
  const [plans, setPlans] = useState<PlanInfo[]>([]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/audit/plan", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <NewPlanModal />
      {plans.map((plan) => (
        <EditPlanModal
          key={plan.id}
          plan={plan}
          onPlanUpdated={fetchPlans}
        />
      ))}
    </div>
  );
}