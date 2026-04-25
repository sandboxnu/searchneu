import { GuestHeaderClient } from "@/components/graduate/GuestHeaderClient";
import { GuestPlanClient } from "@/components/graduate/GuestPlanClient";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import { auth } from "@/lib/auth/auth";
import { getAuditPlans } from "@/lib/dal/audits";
import { getMajor, getMinor } from "@/lib/dal/catalog";
import { getCourseNamesBatch } from "@/lib/dal/courses";
import { Requirement } from "@/lib/graduate/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    majors?: string | string[];
    minors?: string | string[];
    catalogYear?: string;
    courses?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    const plans = await getAuditPlans(session.user.id);
    if (plans.length > 0) {
      const lastModified = plans.reduce((latest, plan) =>
        plan.updatedAt > latest.updatedAt ? plan : latest,
      );
      redirect(`/graduate/${lastModified.id}`);
    }
    return (
      <div>
        <NewPlanModal isGuest={false} />
      </div>
    );
  }

  const params = await searchParams;
  const toArray = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v.filter(Boolean) : [v];
  };
  const majorNames = toArray(params.majors);
  const minorNames = toArray(params.minors);
  const catalogYear = params.catalogYear ? Number(params.catalogYear) : null;
  const scheduleCourseKeys = params.courses
    ? params.courses.split(",").filter(Boolean)
    : [];

  let courseNames: Record<string, string> = {};
  if (catalogYear) {
    const [majors, minors] = await Promise.all([
      Promise.all(majorNames.map((m) => getMajor(catalogYear, m))),
      Promise.all(minorNames.map((m) => getMinor(catalogYear, m))),
    ]);

    const keys = new Set<string>(scheduleCourseKeys);
    for (const m of [...majors, ...minors]) {
      if (!m) continue;
      for (const section of m.requirementSections) {
        collectCourseKeys(section.requirements, keys);
      }
    }

    courseNames = await getCourseNamesBatch(keys);
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-6">
      <GuestHeaderClient />
      <GuestPlanClient initialCourseNames={courseNames} />
    </div>
  );
}
