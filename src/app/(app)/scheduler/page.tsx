import { db } from "@/db";
import { nupathsT } from "@/db/schema";
import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { SchedulerWrapper } from "@/components/scheduler/SchedulerWrapper";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ courseIds?: string }>;
}) {
  const params = await searchParams;
  
  // Parse course IDs from URL search params
  const courseIds = params.courseIds
    ?.split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id)) || [];

  // Generate schedules if course IDs are provided
  const allSchedules = courseIds.length > 0 ? await generateSchedules(courseIds) : [];

  // Fetch available NUPath options
  const nupathOptions = await db
    .selectDistinct({ short: nupathsT.short, name: nupathsT.name})
    .from(nupathsT)
    .then((c) => c.map((e) => ({ label: e.name, value: e.short})));

  return <SchedulerWrapper initialSchedules={allSchedules} nupathOptions={nupathOptions} />;
}
