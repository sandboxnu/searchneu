import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SectionTable } from "./sectionTable";

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // NOTE: puling cookies here just to get it dynamic for now
  const cookieStore = await cookies();
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
    <div className="py-8 px-6 flex-col gap-8 flex overflow-y-scroll h-[calc(100vh-100px)] bg-secondary border-l-[0.5px]">
      <div>
        <h1 className="font-semibold text-2xl">{course}</h1>
        <div className="flex gap-2">
          <h2 className="">{result[0].name}</h2>
          <span>·</span>
          <h2 className="">
            {creditRange} {creditLabel}
          </h2>
        </div>
      </div>
      <div className="rounded bg-background shadow-sm py-4 px-5">
        <h3 className="text-secondary-foreground pb-3 text-sm">Description</h3>
        <p>{result[0].description}</p>
      </div>
      <div className="">
        <h2 className="font-semibold text-xl pb-3">Available Sections</h2>
        <SectionTable sections={sections} />
      </div>
    </div>
  );
}
