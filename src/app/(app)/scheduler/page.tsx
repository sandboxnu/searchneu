import { generateSchedules } from "@/lib/scheduler/generateSchedules";

export default async function Page() {
  // test since we don't have a testing library yet
  const schedules = await generateSchedules([15143, 15145, 15147, 15151]);
  return (
    <div className="container mx-auto p-6">
      Scheduler
      <pre>{JSON.stringify(schedules.slice(0, 5), null, 2)}</pre>
    </div>
  );
}
