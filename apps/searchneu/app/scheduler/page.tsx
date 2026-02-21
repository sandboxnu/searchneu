import { getTerms } from "@/lib/controllers/getTerms";
import { DashboardClient } from "@/components/scheduler/Dashboard";

export default async function Dashboard() {
  const terms = await getTerms();

  return <DashboardClient terms={terms} />;
}
