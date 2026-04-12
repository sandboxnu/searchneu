"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Audit, HydratedAuditPlan, Whiteboard } from "@/lib/graduate/types";
import { BasePlanClient } from "./BasePlanClient";

interface PlanClientProps {
  plan: HydratedAuditPlan & { courseNames: Record<string, string> };
  courseNames: Record<string, string>;
}

export function PlanClient({ plan, courseNames }: PlanClientProps) {
  const handlePersistSchedule = useCallback(
    async (stripped: Audit, pruned: Whiteboard | null) => {
      try {
        const body: Record<string, unknown> = { schedule: stripped };
        if (pruned) body.whiteboard = pruned;

        const res = await fetch(`/api/audit/plan/${plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to save");
        }
      } catch {
        toast.error("Failed to save plan");
      }
    },
    [plan.id],
  );

  const handlePersistWhiteboard = useCallback(
    async (updated: Whiteboard) => {
      try {
        const res = await fetch(`/api/audit/plan/${plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ whiteboard: updated }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to save whiteboard");
        }
      } catch {
        toast.error("Failed to save whiteboard");
      }
    },
    [plan.id],
  );

  return (
    <BasePlanClient
      initialSchedule={plan.schedule}
      initialWhiteboard={plan.whiteboard ?? {}}
      majors={plan.majors}
      minors={plan.minors}
      concentration={plan.concentration}
      courseNames={courseNames}
      onPersistSchedule={handlePersistSchedule}
      onPersistWhiteboard={handlePersistWhiteboard}
    />
  );
}
