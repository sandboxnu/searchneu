"use client";

import { useState } from "react";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";
import NewPlanModal from "./NewPlanModal";

export default function Page() {
  const { data, error } = useSupportedMajors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<
    number | undefined | null
  >();

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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlanId={selectedPlanId}
        setSelectedPlanId={setSelectedPlanId}
      ></NewPlanModal>
    </div>
  );
}
