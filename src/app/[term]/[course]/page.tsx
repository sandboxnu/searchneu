import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SectionTable } from "./_mu/sectionTable";
import { ExpandableDescription } from "./_mu/expandableDescription";

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
}) {
  const course = decodeURIComponent((await props.params)?.course) ?? "";

  const result = await db
    .select({
      id: coursesT.id,
      name: coursesT.name,
      description: coursesT.description,
      minCredits: coursesT.minCredits,
      maxCredits: coursesT.maxCredits,
    })
    .from(coursesT)
    .where(
      and(
        eq(coursesT.term, (await props.params).term),
        eq(coursesT.courseNumber, course.split(" ")[1]),
        eq(coursesT.subject, course.split(" ")[0]),
      ),
    );

  const c = result[0];

  const sections = await db
    .select({
      crn: sectionsT.crn,
      campus: sectionsT.campus,
      seatCapacity: sectionsT.seatCapacity,
      seatRemaining: sectionsT.seatRemaining,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      meetingTimes: sectionsT.meetingTimes,
      faculty: sectionsT.faculty,
      honors: sectionsT.honors,
    })
    .from(sectionsT)
    .where(eq(sectionsT.courseId, c.id));

  if (result.length === 0) {
    return <p>course {course} not found</p>;
  }

  if (result.length > 1) {
    return <p>multiple courses matching {course} found!</p>;
  }

  let creditRange = "";
  if (c.minCredits === c.maxCredits) {
    creditRange = c.minCredits;
  } else {
    creditRange = c.minCredits + "-" + c.maxCredits;
  }

  let creditLabel = "credits";
  if (creditRange === "1") {
    creditLabel = "credit";
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col gap-8 overflow-y-scroll px-6 pb-8">
      <div className="bg-background sticky top-0 bottom-0 z-10 -mr-4 -ml-4 pt-2 pb-4 pl-4">
        <h1 className="text-2xl font-semibold">{course}</h1>
        <div className="flex gap-2">
          <h2 className="">{result[0].name}</h2>
          <span>·</span>
          <h2 className="">
            {creditRange} {creditLabel}
          </h2>
        </div>
      </div>
      <div className="bg-background -mt-4 rounded px-5 py-4 shadow-sm">
        <h3 className="text-secondary-foreground pb-3 text-sm">Description</h3>
        <ExpandableDescription description={result[0].description} />
      </div>
      <div className="flex gap-5">
        <div className="bg-background grow rounded px-5 py-4 shadow-sm">
          <h3 className="text-secondary-foreground pb-3 text-sm">NU Paths</h3>
        </div>
        <div className="bg-background grow rounded px-5 py-4 shadow-sm">
          <h3 className="text-secondary-foreground pb-3 text-sm">Prereqs</h3>
        </div>
        <div className="bg-background grow rounded px-5 py-4 shadow-sm">
          <h3 className="text-secondary-foreground pb-3 text-sm">Coreqs</h3>
        </div>
      </div>
      <div className="">
        <h2 className="pb-3 text-xl font-semibold">Available Sections</h2>
        {/* @ts-expect-error: need to parse out the meetingTimes */}
        <SectionTable sections={sections} />
      </div>
    </div>
  );
}
