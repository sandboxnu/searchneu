import { db } from "@/db";
import { nupathsT, coursesT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { SchedulerWrapper } from "@/components/scheduler/SchedulerWrapper";
import { getTermName } from "@/lib/controllers/getTerms";

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
  const allSchedules = (lockedCourseIds.length > 0 || optionalCourseIds.length > 0)
    ? await generateSchedules(lockedCourseIds, optionalCourseIds) 
    : [];

  const allCourseIds = [...lockedCourseIds, ...optionalCourseIds];

  // Get term from first course to show term name, or use default
  let term = "202630";
  let termName = "Spring 2026";
  
  if (allCourseIds.length > 0) {
    const firstCourse = await db
      .select({ term: coursesT.term })
      .from(coursesT)
      .where(eq(coursesT.id, allCourseIds[0]))
      .limit(1);
    
    term = firstCourse[0]?.term || "202630";
    termName = await getTermName(term);
  } else {
    // Get the current term - fetch from the first course or use a default
    const firstCourse = await db
      .select({ term: coursesT.term })
      .from(coursesT)
      .limit(1);
    
    term = firstCourse[0]?.term || "202630";
    termName = await getTermName(term);
  }

  // Fetch available NUPath options
  const nupathOptions = await db
    .selectDistinct({ short: nupathsT.short, name: nupathsT.name})
    .from(nupathsT)
    .then((c) => c.map((e) => ({ label: e.name, value: e.short})));

  return (
    <div className="bg-secondary h-full w-full px-4 pt-4 xl:px-6">
      <SchedulerWrapper 
        initialSchedules={allSchedules} 
        nupathOptions={nupathOptions}
        term={term}
        termName={termName}
      />
    </div>
  );
}
