import { db } from "@/db";
import { nupathsT, coursesT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { SchedulerWrapper } from "@/components/scheduler/SchedulerWrapper";
import { getTermName } from "@/lib/controllers/getTerms";

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

  // Get term from first course to show term name, or use default
  let term = "202630";
  let termName = "Spring 2026";
  
  if (courseIds.length > 0) {
    const firstCourse = await db
      .select({ term: coursesT.term })
      .from(coursesT)
      .where(eq(coursesT.id, courseIds[0]))
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
