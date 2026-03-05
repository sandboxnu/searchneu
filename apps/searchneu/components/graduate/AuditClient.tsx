import { ClientAuditPlan, PlanClient } from "./PlanClient";
import { HeaderClient } from "./HeaderClient";

export function AuditClient({
  plans,
  plan,
}: {
  plans: ClientAuditPlan[];
  plan: ClientAuditPlan;
}) {
  return (
    <div>
      <HeaderClient plans={plans} />
      <PlanClient plan={plan} />
    </div>
  );
}
