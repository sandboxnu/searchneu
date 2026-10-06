import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuditPlan, getAuditPlans } from "@/lib/dal/audits";
import { getCourseNamesBatch, getCourseDetailsBatch } from "@/lib/dal/courses";
import type { Requisite } from "@sneu/scraper/types";
import { auth } from "@/lib/auth/auth";
import NotFound from "@/app/not-found";
import {
  Audit,
  AuditPlanRow,
  AuditPlanSummary,
  CourseDetails,
  HydratedAuditPlan,
  Major,
  Minor,
  Whiteboard,
  WhiteboardEntry,
  DEFAULT_CATALOG_YEAR,
} from "@/lib/graduate/types";
import { getMajor, getMinor } from "@/lib/dal/catalog";
import { collectCourseKeys } from "@/lib/graduate/requirementUtils";
import { applyScheduleCourseDetails } from "@/lib/graduate/auditUtils";
import { HeaderClient } from "@/components/graduate/HeaderClient";
import { PlanClient } from "@/components/graduate/PlanClient";

/** Extract "SUBJECT-CLASSID" keys from a Requisite (coreqs/prereqs JSON). */
function collectRequisiteKeys(req: Requisite, out: Set<string>): void {
  if (!req || typeof req !== "object") return;
  if ("subject" in req && "courseNumber" in req) {
    out.add(`${req.subject}-${req.courseNumber}`);
  }
  if ("type" in req && "items" in req) {
    for (const item of req.items) collectRequisiteKeys(item, out);
  }
}

/** Handle old format (string[]) and new format (WhiteboardEntry). */
function normalizeWhiteboard(raw: unknown): Whiteboard {
  if (!raw || typeof raw !== "object") return {};
  const out: Whiteboard = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      out[key] = { courses: val as string[], status: "not_started" };
    } else if (val && typeof val === "object" && "courses" in val) {
      out[key] = val as WhiteboardEntry;
    }
  }
  return out;
}

async function hydratePlan(row: AuditPlanRow): Promise<
  HydratedAuditPlan & {
    courseNames: Record<string, string>;
    courseDetails: Record<string, CourseDetails>;
  }
> {
  const majors = (
    row.majors && row.catalogYear
      ? await Promise.all(row.majors.map((m) => getMajor(row.catalogYear!, m)))
      : []
  ).filter((m): m is Major => m !== null);

  const minors = (
    row.minors && row.catalogYear
      ? await Promise.all(row.minors.map((m) => getMinor(row.catalogYear!, m)))
      : []
  ).filter((m): m is Minor => m !== null);

  const schedule = row.schedule as Audit;

  // Collect schedule course keys once, reused for names and details
  const scheduleKeys = new Set<string>();
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes)
        scheduleKeys.add(`${c.subject}-${c.classId}`);
    }
  }

  // Requirement courses are fetched too, so courses dragged in from the
  // sidebar get their real credits and NUPaths
  const allKeys = new Set(scheduleKeys);
  for (const m of [...majors, ...minors]) {
    for (const section of m.requirementSections) {
      collectCourseKeys(section.requirements, allKeys);
    }
  }

  const [courseNames, courseDetails] = await Promise.all([
    getCourseNamesBatch(allKeys),
    getCourseDetailsBatch(allKeys),
  ]);

  // Collect coreq course keys so their names are available in the context
  const coreqKeys = new Set<string>();
  for (const details of Object.values(courseDetails)) {
    collectRequisiteKeys(details.coreqs, coreqKeys);
  }
  // Only fetch names for coreq courses not already in the map
  for (const key of Object.keys(courseNames)) coreqKeys.delete(key);
  if (coreqKeys.size > 0) {
    const coreqNames = await getCourseNamesBatch(coreqKeys);
    Object.assign(courseNames, coreqNames);
  }

  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    schedule: applyScheduleCourseDetails(schedule, courseDetails, courseNames),
    majors,
    minors,
    concentration: row.concentration,
    catalogYear: row.catalogYear ?? DEFAULT_CATALOG_YEAR,
    whiteboard: normalizeWhiteboard(row.whiteboard),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    courseNames,
    courseDetails,
  };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const planId = parseInt((await params).planId, 10);
  if (Number.isNaN(planId)) {
    return <NotFound />;
  }

  const plan = await getAuditPlan(planId, session.user.id);
  const userPlans: AuditPlanSummary[] = await getAuditPlans(session.user.id);

  if (!plan) {
    return <NotFound />;
  }

  const hydrated = await hydratePlan(plan);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-6">
      <HeaderClient plans={userPlans} currentPlan={hydrated} isGuest={false} />
      <PlanClient
        plan={hydrated}
        courseNames={hydrated.courseNames}
        courseDetails={hydrated.courseDetails}
      />
    </div>
  );
}
