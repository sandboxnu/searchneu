"use client";
import { AuditPlanSummary } from "@/lib/graduate/types";
import Link from "next/link";

export function HeaderClient({ plans }: { plans: AuditPlanSummary[] }) {
  return (
    <div className="max-auto bg-neu1 flex h-24 gap-2 overflow-scroll">
      <ul>
        {plans.map((plan) => {
          return (
            <li key={plan.id}>
              <Link href={`/graduate/${plan.id}`}>{plan.name}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
