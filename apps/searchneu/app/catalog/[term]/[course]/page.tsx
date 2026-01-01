import { db, termsT, trackersT, usersT } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { getGuid } from "@/lib/auth/utils";
import { ExpandableDescription } from "@/components/catalog/ExpandableDescription";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Globe, GlobeLock } from "lucide-react";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { type Requisite } from "@sneu/scraper/types";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import {
  SectionTable,
  type SectionTableSection,
} from "@/components/catalog/SectionTable";
import { type Metadata } from "next";
import { RequisiteBlock } from "@/components/catalog/Requisites";
import { getCourse, getCourseSections } from "@/lib/controllers/getCourse";

const cachedCourse = unstable_cache(getCourse, ["banner.course"], {
  revalidate: 3600,
  tags: ["banner.course"],
});

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

  const sections = getCourseSections(course.id);
  const trackedSections = getTrackedSections();

  return (
    <div className="bg-neu1 flex h-full min-w-0 flex-1 flex-shrink-0 flex-col items-center gap-8 self-stretch overflow-y-scroll rounded-t-lg rounded-b-none border border-b-0 px-4 pt-10 pb-8 md:px-10">
      <div className="flex items-end justify-between self-stretch">
        <div className="align-start flex flex-col gap-1">
          <h1
            style={{ lineHeight: 1.2 }}
            className="text-neu8 text-lg font-bold md:text-2xl"
          >
            {courseName}
          </h1>
          <h2
            style={{ lineHeight: 1.3 }}
            className="text-neu8 text-sm md:text-lg"
          >
            {course.name}
          </h2>
        </div>
        <div className="flex flex-col items-end justify-end gap-1">
          <h2
            style={{ lineHeight: 1.2 }}
            className="text-neu8 text-right text-sm font-bold md:text-lg"
          >
            {formatCreditRangeString(course.minCredits, course.maxCredits)}
          </h2>
          <span className="text-neu6 flex max-w-20 items-center gap-1 sm:max-w-full">
            {isTermActive ? (
              <>
                <Globe className="size-4" />
                <h2
                  style={{ lineHeight: 1.3 }}
                  className="text-neu6 text-xs italic md:text-sm"
                >
                  {formatLastUpdatedString(term?.updatedAt)}
                </h2>
              </>
            ) : (
              <>
                <GlobeLock className="size-4" />
                <h2
                  style={{ lineHeight: 1.3 }}
                  className="text-neu6 text-xs italic md:text-sm"
                >
                  {"Last updated " + term.updatedAt.toLocaleDateString()}
                </h2>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 self-stretch">
        <h3
          style={{ lineHeight: 1.16667 }}
          className="text-neu5 text-xs font-bold uppercase"
        >
          COURSE DESCRIPTION
        </h3>
        <ExpandableDescription description={course.description} />
      </div>
      <div className="flex items-start gap-8 self-stretch">
        <div className="flex flex-col items-start gap-1 self-stretch">
          <h3
            style={{ lineHeight: 1.16667 }}
            className="text-neu5 text-xs font-bold"
          >
            LINK
          </h3>
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{ lineHeight: 1.3 }}
            className="text-blue hover:text-blue/80 flex items-center justify-end gap-1"
            href={`https://bnrordsp.neu.edu/ssb-prod/bwckctlg.p_disp_course_detail?cat_term_in=${termId}&subj_code_in=${subject}&crse_numb_in=${courseNumber}`}
          >
            View on the Northeastern website
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col items-start self-stretch">
        <h3 className="text-neu5 col-span-12 text-xs font-bold">NUPATHS</h3>
        <div className="mt-2 flex flex-col gap-2 md:flex-row">
          {course.nupathNames.map((n, i) => (
            <Badge
              key={n}
              className="text-neu6 bg-neu2 border-neu25 flex gap-2 rounded-full border px-3 py-1 text-sm"
            >
              <span className="text-neu7 font-bold">{course.nupaths[i]}</span>
              {n}
            </Badge>
          ))}
          {course.nupaths.length === 0 && (
            <Badge
              variant="secondary"
              className="text-neu4 bg-neu2 rounded-full px-3 py-1 text-xs font-bold"
            >
              No NUPaths
            </Badge>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <h3 className="text-neu5 col-span-12 text-xs font-bold">
          REQUIREMENTS
        </h3>
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="bg-neu2 flex h-fit flex-1 flex-col rounded-lg px-4 py-4">
            <h3 className="text-neu7 mb-2 text-xs font-bold tracking-wide">
              PREREQUISITES
            </h3>
            <RequisiteBlock
              req={course.prereqs as Requisite}
              termId={termId}
              prereqMode={true}
            />
          </div>
          <div className="bg-neu2 flex h-fit flex-1 flex-col rounded-lg px-4 py-4">
            <h3 className="text-neu7 mb-2 text-xs font-bold tracking-wide">
              COREQUISITES
            </h3>
            <RequisiteBlock
              req={course.coreqs as Requisite}
              termId={termId}
              prereqMode={false}
            />
          </div>
          <div className="bg-neu2 flex h-fit flex-1 flex-col rounded-lg px-4 py-4">
            <h3 className="text-neu7 mb-2 text-xs font-bold tracking-wide">
              POSTREQUISITES
            </h3>
            <RequisiteBlock
              req={course.postreqs as Requisite}
              termId={termId}
              prereqMode={false}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div className="-mr-8 -ml-8 inline-block w-full min-w-0 md:-mr-20 md:-ml-20 md:w-[calc(100%+5rem)]">
        <Suspense fallback={<SectionsTableSkeleton />}>
          <SectionTable
            sectionsPromise={sections as Promise<SectionTableSection[]>}
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
