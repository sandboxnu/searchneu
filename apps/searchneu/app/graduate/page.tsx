"use client";

import { useState, useEffect } from "react";
import { useSupportedMajors } from "@/lib/graduate/useGraduateApi";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import EditPlanModal from "@/components/graduate/modal/EditPlanModal";

type PlanInfo = {
  id: number;
  name: string;
  majors?: string[];
  minors?: string[];
  catalogYear?: number;
  concentration?: string;
};

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<
    number | undefined | null
  >();
  const [planToEdit, setPlanToEdit] = useState<PlanInfo | undefined>();
  const [plans, setPlans] = useState<PlanInfo[]>([]);

  const fetchPlan = async (id: number) => {
    try {
      const res = await fetch(`/api/audit/plan/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const plan = await res.json();
        // update the plan in the list if it exists, otherwise add it
        setPlans((prev) => {
          const exists = prev.some((p) => p.id === plan.id);
          return exists
            ? prev.map((p) => (p.id === plan.id ? plan : p))
            : [...prev, plan];
        });
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    }
  };

  useEffect(() => {
    if (selectedPlanId) fetchPlan(selectedPlanId);
  }, [selectedPlanId]);

  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <button
        onClick={() => setIsNewModalOpen(true)}
        className="rounded-2xl bg-red-800 p-10"
      >
        New Plan
      </button>

      {/* list all plans with edit button */}
      {plans.map((plan) => (
        <div key={plan.id} className="mt-4 flex items-center gap-2">
          <p>{plan.name}</p>
          <button
            onClick={() => {
              setPlanToEdit(plan);
              setIsEditModalOpen(true);
            }}
            className="rounded-2xl bg-blue-800 p-2"
          >
            Edit
          </button>
        </div>
      ))}

      <NewPlanModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        setSelectedPlanId={(id) => {
          setSelectedPlanId(id);
          if (id) fetchPlan(id);
        }}
      />

      {planToEdit && (
        <EditPlanModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPlanUpdated={() => {
            if (planToEdit) fetchPlan(planToEdit.id);
          }}
          plan={planToEdit}
        />
      )}

      <p>plan id = {selectedPlanId}</p>
    </div>
  );
}