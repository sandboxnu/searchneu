import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuditPlan, getAuditPlans } from "@/lib/dal/audits";
import { getCourseNamesBatch } from "@/lib/dal/courses";
import { auth } from "@/lib/auth/auth";
import NotFound from "@/app/not-found";
import {
  Audit,
  AuditTerm,
  AuditPlanRow,
  AuditPlanSummary,
  HydratedAuditPlan,
  Major,
  Minor,
  Requirement,
  Whiteboard,
  WhiteboardEntry,
  DEFAULT_CATALOG_YEAR,
} from "@/lib/graduate/types";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { HeaderClient } from "@/components/graduate/HeaderClient";
import { PlanClient } from "@/components/graduate/PlanClient";

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
  schedule: Audit,
  majors: Major[],
  minors: Minor[],
): Promise<Record<string, string>> {
  const keys = new Set<string>();

  for (const year of schedule.years ?? []) {
    for (const term of [year.fall, year.spring, year.summer1, year.summer2]) {
      for (const c of term.classes) keys.add(`${c.subject}-${c.classId}`);
    }
  }

  for (const m of [...majors, ...minors]) {
    for (const section of m.requirementSections) {
      collectCourseKeys(section.requirements, keys);
    }
  }

  return getCourseNamesBatch(keys);
}

/** Apply the name map to all courses in a schedule. */
function applyNamesToSchedule(
  schedule: Audit,
  nameMap: Record<string, string>,
): Audit {
  const applyNames = (term: AuditTerm): AuditTerm => ({
    ...term,
    classes: term.classes.map((c) => ({
      ...c,
      name: nameMap[`${c.subject}-${c.classId}`] ?? c.name,
    })),
  });
  return {
    years: (schedule.years ?? []).map((year) => ({
      ...year,
      fall: applyNames(year.fall),
      spring: applyNames(year.spring),
      summer1: applyNames(year.summer1),
      summer2: applyNames(year.summer2),
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

async function hydratePlan(
  row: AuditPlanRow,
): Promise<HydratedAuditPlan & { courseNames: Record<string, string> }> {
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
  const courseNames = await buildCourseNameMap(schedule, majors, minors);

  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    schedule: applyNamesToSchedule(schedule, courseNames),
    majors,
    minors,
    concentration: row.concentration,
    catalogYear: row.catalogYear ?? DEFAULT_CATALOG_YEAR,
    whiteboard: normalizeWhiteboard(row.whiteboard),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    courseNames,
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
    <div className="mx-auto flex flex-col gap-4 px-6">
      <HeaderClient plans={userPlans} currentPlan={hydrated} isGuest={false} />
      <PlanClient plan={hydrated} courseNames={hydrated.courseNames} />
    </div>
  );
}
