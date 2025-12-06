import { db } from "@/db";
import { nupathsT } from "@/db/schema";
import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { SchedulerWrapper } from "@/components/scheduler/SchedulerWrapper";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lockedCourseIds?: string; optionalCourseIds?: string }>;
}) {
  const params = await searchParams;
  
  // Parse locked and optional course IDs from URL search params
  const lockedCourseIds = params.lockedCourseIds
    ?.split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id)) || [];

  const optionalCourseIds = params.optionalCourseIds
    ?.split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id)) || [];

  // Generate schedules if any course IDs are provided (locked or optional)
  // TODO: Update generateSchedules to handle locked vs optional separately
  const allCourseIds = [...lockedCourseIds, ...optionalCourseIds];
  const allSchedules = allCourseIds.length > 0
    ? await generateSchedules(allCourseIds) 
    : [];

  // Fetch available NUPath options
  const nupathOptions = await db
    .selectDistinct({ short: nupathsT.short, name: nupathsT.name})
    .from(nupathsT)
    .then((c) => c.map((e) => ({ label: e.name, value: e.short})));

  return (
    <div className="bg-secondary h-full w-full px-4 pt-4 xl:px-6">
      <SchedulerWrapper initialSchedules={allSchedules} nupathOptions={nupathOptions} />
    </div>
  );
}
