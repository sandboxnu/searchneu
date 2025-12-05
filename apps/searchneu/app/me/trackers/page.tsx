import { db } from "@/db";
import { coursesT, sectionsT, trackersT, usersT } from "@/db/schema";
import { getGuid } from "@/lib/auth/utils";
import { logger } from "@/lib/logger";
import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const guid = await getGuid();
  if (!guid) {
    redirect("/");
  }
  const user = await db.query.usersT.findFirst({
    where: eq(usersT.guid, guid),
  });
  if (!user) {
    redirect("/");
  }

  const trackedSections = await db
    .select({
      term: sectionsT.term,
      id: sectionsT.id,
      courseId: coursesT.id,
      crn: sectionsT.crn,
      courseSubject: coursesT.subject,
      courseNumber: coursesT.courseNumber,
      courseName: coursesT.name,

      faculty: sectionsT.faculty,
      campus: sectionsT.campus,
      honors: sectionsT.honors,
      classType: sectionsT.classType,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
    })
    .from(trackersT)
    .innerJoin(sectionsT, eq(trackersT.sectionId, sectionsT.id))
    .innerJoin(coursesT, eq(coursesT.id, sectionsT.courseId))
    .where(and(eq(trackersT.userId, user.id), isNull(trackersT.deletedAt)));

  const courses = trackedSections.reduce(
    (agg, s) => {
      const courseId = String(s.courseId);
      if (!Object.keys(agg).includes(courseId)) {
        agg[courseId] = [s];
        return agg;
      }
      agg[courseId].push(s);
      return agg;
    },
    {} as { [key: string]: typeof trackedSections },
  );

  logger.info(courses);

  return (
    <div className="space-y-6 px-10 py-2">
      <h1 className="text-3xl font-bold">Seat Trackers</h1>
      <div className="flex flex-col gap-4">
        {Object.keys(courses).map((s) => (
          <div key={s} className="bg-neu2 rounded-lg p-1">
            <div className="">
              <span className="flex items-center justify-baseline gap-1">
                <h3 className="text-xl font-bold">
                  {courses[s][0].courseSubject +
                    " " +
                    courses[s][0].courseNumber}
                </h3>
                <p className="text-xl">- {courses[s][0].courseName}</p>
              </span>
              <Link
                className="text-blue hover:text-blue/80 hover:underline"
                href={
                  "/catalog/" +
                  courses[s][0].term +
                  "/" +
                  courses[s][0].courseSubject +
                  "%20" +
                  courses[s][0].courseNumber
                }
              >
                View in Catalog
              </Link>
            </div>
            <div className="flex flex-col gap-1 pt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
