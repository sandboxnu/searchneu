import { db } from "@/db";
import {
  coursesT,
  termsT,
  sectionsT,
  trackersT,
  usersT,
  meetingTimesT,
  courseNupathJoinT,
  nupathsT,
  roomsT,
  buildingsT,
} from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getGuid } from "@/lib/auth/utils";
import { ExpandableDescription } from "@/components/coursePage/ExpandableDescription";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Globe, GlobeLock } from "lucide-react";
import { type JSX, Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { type Requisite } from "@/scraper/reqs";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import {
  SectionTable,
  type Section,
  type Room,
} from "@/components/coursePage/SectionTable";
import { type Metadata } from "next";
import { ReqsWrapper } from "@/components/coursePage/ReqsWrapper";

const cachedCourse = unstable_cache(
  async (term: string, subject: string, courseNumber: string) =>
    db
      .select({
        id: coursesT.id,
        name: coursesT.name,
        subject: coursesT.subject,
        courseNumber: coursesT.courseNumber,
        register: coursesT.register,
        description: coursesT.description,
        minCredits: coursesT.minCredits,
        maxCredits: coursesT.maxCredits,
        prereqs: coursesT.prereqs,
        coreqs: coursesT.coreqs,
        updatedAt: coursesT.updatedAt,
        nupaths: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
        nupathNames: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.name}), null)`,
      })
      .from(coursesT)
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .where(
        and(
          eq(coursesT.term, term),
          eq(coursesT.subject, subject),
          eq(coursesT.courseNumber, courseNumber),
        ),
      )
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.subject,
        coursesT.courseNumber,
        coursesT.register,
        coursesT.description,
        coursesT.minCredits,
        coursesT.maxCredits,
        coursesT.prereqs,
        coursesT.coreqs,
        coursesT.updatedAt,
      ),
  ["banner.course"],
  {
    revalidate: 3600,
    tags: ["banner.course"],
  },
);

async function getTrackedSections() {
  const guid = await getGuid();
  if (!guid) return [];

  const user = await db.query.usersT.findFirst({
    where: eq(usersT.guid, guid),
  });
  if (!user) return [];

  const trackedSections = await db.query.trackersT.findMany({
    where: and(eq(trackersT.userId, user.id), isNull(trackersT.deletedAt)),
  });

  return trackedSections.map((t) => t.sectionId);
}

export async function generateMetadata(props: {
  params: Promise<{ term: string; course: string }>;
}): Promise<Metadata> {
  return {
    title: decodeURIComponent((await props.params)?.course) ?? "",
  };
}

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
}) {
  const termId = (await props.params).term;
  const courseName = decodeURIComponent((await props.params)?.course) ?? "";
  const subject = courseName.split(" ")[0];
  const courseNumber = courseName.split(" ")[1];

  const term = await db.query.termsT.findFirst({
    where: eq(termsT.term, termId),
  });

  if (!term) {
    return <p>term {term} not found</p>;
  }

  const now = new Date();
  const isTermActive = term.activeUntil > now;

  const courseResp = await cachedCourse(termId, subject, courseNumber);

  if (!courseResp || courseResp.length === 0) {
    notFound();
  }

  const course = courseResp[0];

  const sections = db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      campus: sectionsT.campus,
      honors: sectionsT.honors,
      classType: sectionsT.classType,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      // Meeting time data
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
      // Room data
      roomId: roomsT.id,
      roomNumber: roomsT.number,
      // Building data
      buildingId: buildingsT.id,
      buildingName: buildingsT.name,
    })
    .from(sectionsT)
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .leftJoin(roomsT, eq(meetingTimesT.roomId, roomsT.id))
    .leftJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
    .where(eq(sectionsT.courseId, course.id))
    .then((rows) => {
      // Group the rows by section and reconstruct the meetingTimes array
      const sectionMap = new Map<number, Section>();

      for (const row of rows) {
        if (!sectionMap.has(row.id)) {
          sectionMap.set(row.id, {
            id: row.id,
            crn: row.crn,
            faculty: row.faculty,
            campus: row.campus,
            honors: row.honors,
            classType: row.classType,
            seatRemaining: row.seatRemaining,
            seatCapacity: row.seatCapacity,
            waitlistCapacity: row.waitlistCapacity,
            waitlistRemaining: row.waitlistRemaining,
            meetingTimes: [],
          });
        }

        // Add meeting time if it exists
        if (row.meetingTimeId && row.days && row.startTime && row.endTime) {
          const section = sectionMap.get(row.id)!;

          const room: Room | undefined =
            row.roomId && row.roomNumber
              ? {
                  id: row.roomId,
                  number: row.roomNumber,
                  building:
                    row.buildingId && row.buildingName
                      ? { id: row.buildingId, name: row.buildingName }
                      : undefined,
                }
              : undefined;

          section.meetingTimes.push({
            days: row.days,
            startTime: row.startTime,
            endTime: row.endTime,
            final: false, // You'll need to add this field to meetingTimesT if needed
            room,
            finalDate: undefined,
          });
        }
      }

      return Array.from(sectionMap.values());
    });

  const trackedSections = getTrackedSections();

  return (
    <div className="bg-neu1 border-border flex h-[calc(100vh-124px)] flex-1 flex-shrink-0 flex-col items-center gap-8 self-stretch overflow-y-scroll rounded-t-lg border pt-10 pb-8">
      <div className="flex items-end justify-between self-stretch px-10">
        <div className="align-start flex flex-col gap-1">
          <h1
            style={{ lineHeight: 1.2 }}
            className="text-expanded-system-neu8 text-2xl font-bold"
          >
            {courseName}
          </h1>
          <h2
            style={{ lineHeight: 1.3 }}
            className="text-expanded-system-neu8 text-lg"
          >
            {course.name}
          </h2>
        </div>
        <div className="flex flex-col items-end justify-end gap-1">
          <h2
            style={{ lineHeight: 1.2 }}
            className="text-expanded-system-neu8 text-right text-lg font-bold"
          >
            {formatCreditRangeString(course.minCredits, course.maxCredits)}
          </h2>
          <span className="text-neu6 flex items-center gap-1">
            {isTermActive ? (
              <>
                <Globe className="size-4" />
                <h2
                  style={{ lineHeight: 1.3 }}
                  className="text-expanded-system-neu6 text-sm italic"
                >
                  {formatLastUpdatedString(term?.updatedAt)}
                </h2>
              </>
            ) : (
              <>
                <GlobeLock className="size-4" />
                <h2
                  style={{ lineHeight: 1.3 }}
                  className="text-expanded-system-neu6 text-sm italic"
                >
                  {"Last updated on " + term.updatedAt.toLocaleDateString()}
                </h2>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 self-stretch px-10">
        <h3
          style={{ lineHeight: 1.16667 }}
          className="text-expanded-system-neu5 text-xs font-bold uppercase"
        >
          COURSE DESCRIPTION
        </h3>
        <ExpandableDescription description={course.description} />
      </div>
      <div className="flex items-start gap-8 self-stretch px-10">
        <div className="flex flex-col items-start gap-1 self-stretch">
          <h3
            style={{ lineHeight: 1.16667 }}
            className="text-expanded-system-neu5 text-xs font-bold"
          >
            LINK
          </h3>
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{ lineHeight: 1.3 }}
            className="text-brand-palette-links-blue hover:text-brand-palette-links-blue/80 flex items-center justify-end gap-1"
            href={`https://bnrordsp.neu.edu/ssb-prod/bwckctlg.p_disp_course_detail?cat_term_in=${termId}&subj_code_in=${subject}&crse_numb_in=${courseNumber}`}
          >
            View on the Northeastern website
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col items-start self-stretch px-10">
        <h3 className="text-expanded-system-neu5 pb-2 text-xs font-bold">
          NUPATHS
        </h3>
        <div className="flex gap-2">
          {course.nupathNames.map((n) => (
            <Badge key={n} className="px-2 py-0 text-xs font-bold">
              {n}
            </Badge>
          ))}
          {course.nupaths.length === 0 && (
            <Badge
              variant="secondary"
              className="text-neu6 px-2 py-0 text-xs font-bold"
            >
              No NUPaths
            </Badge>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 pr-10 pl-10">
        <h3 className="text-expanded-system-neu5 col-span-12 text-xs font-bold">
          REQUIREMENTS
        </h3>
        <div className="flex items-start gap-2">
          <ReqsWrapper
            title="prerequisites"
            reqs={course.prereqs as Requisite}
            termId={termId}
          />
          <ReqsWrapper
            title="corequisites"
            reqs={course.coreqs as Requisite}
            termId={termId}
          />
        </div>
      </div>
      <Separator />
      <div className="w-full px-10">
        <Suspense fallback={<SectionsTableSkeleton />}>
          <SectionTable
            sectionsPromise={sections as Promise<Section[]>}
            trackedSectionsPromise={trackedSections as Promise<number[]>}
            isTermActive={isTermActive}
          />
        </Suspense>
      </div>
    </div>
  );
}

function formatCreditRangeString(minCredits: string, maxCredits: string) {
  let creditRange = "";
  if (minCredits === maxCredits) {
    creditRange = minCredits;
  } else {
    creditRange = minCredits + "-" + maxCredits;
  }

  let creditLabel = "credits";
  if (creditRange === "1") {
    creditLabel = "credit";
  }

  return creditRange + " " + creditLabel;
}

function formatLastUpdatedString(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let str = "Updated ";

  if (seconds < 0) {
    str += "in the future???";
    return str;
  }

  if (seconds < 60) {
    str += "less than a minute ago";
    return str;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    str += minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    return str;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    str += hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    return str;
  }

  const days = Math.floor(hours / 24);
  str += days === 1 ? "1 day ago" : `${days} days ago`;
  return str;
}

function SectionsTableSkeleton() {
  return (
    <div className="bg-neu2 flex w-full flex-col gap-1 rounded-lg p-1">
      <p className="text-neu6 w-full text-center text-sm">Loading...</p>
    </div>
  );
}
