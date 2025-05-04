import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SectionTable } from "@/components/coursePage/SectionTable";
import { ExpandableDescription } from "@/components/coursePage/ExpandableDescription";
import { Separator } from "@/components/ui/separator";
import { convertNupathToLongform } from "@/lib/banner/nupaths";
import Link from "next/link";

// PERF: switch to ISR (need to pull seat data out first)
// export const revalidate = 3600;

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
}) {
  const course = decodeURIComponent((await props.params)?.course) ?? "";

  const term = (await props.params).term;
  const courseNumber = course.split(" ")[1];
  const subject = course.split(" ")[0];

  const result = await db
    .select({
      id: coursesT.id,
      name: coursesT.name,
      description: coursesT.description,
      minCredits: coursesT.minCredits,
      maxCredits: coursesT.maxCredits,
      nupaths: coursesT.nupaths,
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
    <div className="flex h-[calc(100vh-56px)] flex-col gap-8 overflow-y-scroll px-6 pt-8 pb-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{course}</h1>
          <h2 className="">{result[0].name}</h2>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-medium">
            {creditRange} {creditLabel}
          </h2>
          <Link
            className="text-b2 hover:text-b2/80"
            href={`https://bnrordsp.neu.edu/ssb-prod/bwckctlg.p_disp_course_detail?cat_term_in=${term}&subj_code_in=${subject}&crse_numb_in=${courseNumber}`}
          >
            View on NEU
          </Link>
        </div>
      </div>
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">
          Course Description
        </h3>
        <ExpandableDescription description={result[0].description} />
      </div>
      <Separator />
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">NUPaths</h3>
        <div className="flex gap-2">
          {c.nupaths.map((n) => (
            <span key={n} className="bg-neu3 rounded px-2 py-1 text-sm">
              {convertNupathToLongform(n)}
            </span>
          ))}
          {c.nupaths.length === 0 && <p>None</p>}
        </div>
      </div>
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">Prereqs</h3>
        <p>None</p>
      </div>
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">Coreqs</h3>
        <p>None</p>
      </div>
      <Separator />
      <div className="w-full">
        {/* <h3 className="text-neu7 pb-2 text-sm font-medium">Sections</h3> */}
        {/* @ts-expect-error: need to parse out the meetingTimes */}
        <SectionTable sections={sections} />
      </div>
    </div>
  );
}
