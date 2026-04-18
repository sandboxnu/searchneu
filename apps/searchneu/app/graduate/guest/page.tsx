import { GuestHeaderClient } from "@/components/graduate/GuestHeaderClient";
import { GuestPlanClient } from "@/components/graduate/GuestPlanClient";
import { getCourseNamesBatch } from "@/lib/dal/courses";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { Requirement } from "@/lib/graduate/types";

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
    majors?: string;
    minors?: string;
    catalogYear?: string;
    courses?: string;
  }>;
}) {
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
      Promise.all(
        majorNames.map((m) => GraduateAPI.majors.get(catalogYear, m)),
      ),
      Promise.all(
        minorNames.map((m) => GraduateAPI.minors.get(catalogYear, m)),
      ),
    ]);

    const keys = new Set<string>(scheduleCourseKeys);
    for (const m of [...majors, ...minors]) {
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
