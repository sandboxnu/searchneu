import { db } from "@/db";
import { coursesT, termsT, sectionsT, trackersT, usersT } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getGuid } from "@/lib/auth/utils";
import { ExpandableDescription } from "@/components/coursePage/ExpandableDescription";
import { Separator } from "@/components/ui/separator";
import { convertNupathToLongform } from "@/lib/banner/nupaths";
import Link from "next/link";
import { ExternalLink, Globe, GlobeLock } from "lucide-react";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { SectionFilterWrapper } from "@/components/coursePage/SectionFilterWrapper";
import { Section } from "@/components/coursePage/SectionCard";

const cachedCourse = unstable_cache(
  async (term: string, subject: string, courseNumber: string) =>
    db.query.coursesT.findFirst({
      where: and(
        eq(coursesT.term, term),
        eq(coursesT.subject, subject),
        eq(coursesT.courseNumber, courseNumber),
      ),
    }),
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
}) {
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

  const course = await cachedCourse(termId, subject, courseNumber);

  if (!course) {
    return <p>course {courseName} not found</p>;
  }

  const sections = db.query.sectionsT.findMany({
    where: eq(sectionsT.courseId, course.id),
  });

  const trackedSections = getTrackedSections();

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col gap-4 overflow-y-scroll px-2 pt-8 pb-8 xl:px-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{courseName}</h1>
          <h2 className="">{course.name}</h2>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-medium">
            {formatCreditRangeString(course.minCredits, course.maxCredits)}
          </h2>
          <Link
            className="text-blue hover:text-blue/80 flex items-center justify-end gap-1"
            href={`https://bnrordsp.neu.edu/ssb-prod/bwckctlg.p_disp_course_detail?cat_term_in=${termId}&subj_code_in=${subject}&crse_numb_in=${courseNumber}`}
          >
            View on Banner
            <ExternalLink className="size-4" />
          </Link>
          <span className="flex items-center gap-1">
            {isTermActive ? (
              <>
                <h2 className="text-sm">
                  {formatLastUpdatedString(term?.updatedAt)}
                </h2>
                <Globe className="size-4" />
              </>
            ) : (
              <>
                <h2 className="text-sm">
                  {formatLastUpdatedString(term?.updatedAt)}
                </h2>
                <GlobeLock className="size-4" />
              </>
            )}
          </span>
        </div>
      </div>
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">Description</h3>
        <ExpandableDescription description={course.description} />
      </div>
      <Separator />
      <div className="">
        <h3 className="text-neu7 pb-2 text-sm font-medium">NUPaths</h3>
        <div className="flex gap-2">
          {course.nupaths.map((n) => (
            <span key={n} className="bg-neu3 rounded px-2 py-0.5 text-sm">
              {convertNupathToLongform(n)}
            </span>
          ))}
          {course.nupaths.length === 0 && <p>None</p>}
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="">
          <h3 className="text-neu7 pb-2 text-sm font-medium">Prereqs</h3>
          <p>None</p>
        </div>
        <div className="">
          <h3 className="text-neu7 pb-2 text-sm font-medium">Coreqs</h3>
          <p>None</p>
        </div>
      </div>
      <Separator />
      <div className="w-full">
        <h3 className="text-neu7 pb-2 text-sm font-medium">Sections</h3>
        <Suspense fallback={<SectionsTableSkeleton />}>
          <SectionFilterWrapper
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
