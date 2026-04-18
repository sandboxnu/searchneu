import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuditPlan, getAuditPlans } from "@/lib/dal/audits";
import {
  getCourseNamesBatch,
  getCourseNupathsBatch,
  getCourseDetailsBatch,
} from "@/lib/dal/courses";
import type { Requisite } from "@sneu/scraper/types";
import { auth } from "@/lib/auth/auth";
import NotFound from "@/app/not-found";
import {
  Audit,
  AuditCourse,
  AuditTerm,
  AuditPlanRow,
  AuditPlanSummary,
  CourseDetails,
  HydratedAuditPlan,
  Major,
  Minor,
  NUPathEnum,
  Requirement,
  Whiteboard,
  WhiteboardEntry,
  DEFAULT_CATALOG_YEAR,
} from "@/lib/graduate/types";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
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

/** Recursively collect all "SUBJECT-CLASSID" keys from a requirement tree. */
function collectCourseKeys(reqs: Requirement[], out: Set<string>): void {
  for (const req of reqs) {
    if (req.type === "COURSE") {
      out.add(`${req.subject}-${req.classId}`);
    } else if (req.type === "AND" || req.type === "OR" || req.type === "XOM") {
      collectCourseKeys(req.courses, out);
    } else if (req.type === "SECTION") {
      collectCourseKeys(req.requirements, out);
    }
  }
}

/**
 * Build a "SUBJECT-CLASSID" → name map by batch-fetching all unique courses
 * from the schedule and major/minor requirements in a single query.
 */
async function buildCourseNameMap(
  scheduleKeys: Set<string>,
  majors: Major[],
  minors: Minor[],
): Promise<Record<string, string>> {
  const keys = new Set(scheduleKeys);
  for (const m of [...majors, ...minors]) {
    for (const section of m.requirementSections) {
      collectCourseKeys(section.requirements, keys);
    }
  }
  return getCourseNamesBatch(keys);
}

/** Map over every course in a schedule, applying a transform function. */
function mapScheduleCourses(
  schedule: Audit,
  fn: (c: AuditCourse) => AuditCourse,
): Audit {
  const mapTerm = (term: AuditTerm): AuditTerm => ({
    ...term,
    classes: term.classes.map(fn),
  });
  return {
    years: (schedule.years ?? []).map((year) => ({
      ...year,
      fall: mapTerm(year.fall),
      spring: mapTerm(year.spring),
      summer1: mapTerm(year.summer1),
      summer2: mapTerm(year.summer2),
    })),
  };
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
  const majors =
    row.majors && row.catalogYear
      ? await Promise.all(
          row.majors.map((m) => GraduateAPI.majors.get(row.catalogYear!, m)),
        )
      : [];

  const minors =
    row.minors && row.catalogYear
      ? await Promise.all(
          row.minors.map((m) => GraduateAPI.minors.get(row.catalogYear!, m)),
        )
      : [];

  const schedule = row.schedule as Audit;

  // Collect schedule course keys once, reused for names, nupaths, and details
  const scheduleKeys = new Set<string>();
  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes)
        scheduleKeys.add(`${c.subject}-${c.classId}`);
    }
  }

  const courseNames = await buildCourseNameMap(scheduleKeys, majors, minors);
  const [courseNupaths, courseDetails] = await Promise.all([
    getCourseNupathsBatch(scheduleKeys),
    getCourseDetailsBatch(scheduleKeys),
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
    schedule: mapScheduleCourses(schedule, (c) => {
      const key = `${c.subject}-${c.classId}`;
      const details = courseDetails[key];
      return {
        ...c,
        name: courseNames[key] ?? c.name,
        nupaths: (courseNupaths[key] ?? []).filter(
          (code): code is NUPathEnum => code in NUPathEnum,
        ),
        ...(details && {
          numCreditsMin: details.minCredits,
          numCreditsMax: details.maxCredits,
          coreqs: details.coreqs,
          prereqs: details.prereqs,
        }),
      };
    }),
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

  const planId = (await params).planId;
  const plan = await getAuditPlan(parseInt(planId, 10), session.user.id);
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
