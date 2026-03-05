"use client";
import { ClientAuditPlan } from "./PlanClient";

export function HeaderClient({ plans }: { plans: ClientAuditPlan[] }) {
  // get map of plan name -> plan id
  //const userPlans = use(getPlans(parseInt(plan.userId,10)))
  console.log("DENNIS PLANS", plans);

  return (
    <div className="max-auto flex h-24 gap-2 overflow-scroll bg-white">
      <div>hahah so many plans</div>
      {/* TICKET WORK : MAKE DROPDOWN COMPONENT FOR PLAN SELECTION */}
      <ul>
        {plans.map((plan) => {
          return <li key={plan.id}>{plan.name}</li>;
        })}
      </ul>
    </div>
  );
}
