import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { SchedulerView } from "@/components/scheduler/SchedulerView";

export default async function Page() {
  // Generate all valid schedules (no time conflicts)
  const allSchedules = await generateSchedules([
    17500,
    16048,
    15783,
    17501
  ]);

  return <SchedulerView allSchedules={allSchedules} />;
}
