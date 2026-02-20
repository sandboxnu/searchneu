"use client";

import { useState } from "react";
import { useSupportedMajors } from "@/lib/graduate/useGraduateApi";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-2xl bg-red-800 p-10"
      >
        click me
      </button>
      <NewPlanModal
        onClose={() => setIsModalOpen(false)}
        setSelectedPlanId={setSelectedPlanId}
      />
      <p>plan id = {selectedPlanId}</p>
    </div>
  );
}
