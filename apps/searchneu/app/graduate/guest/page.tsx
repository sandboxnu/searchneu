import { GuestHeaderClient } from "@/components/graduate/GuestHeaderClient";
import { GuestPlanClient } from "@/components/graduate/GuestPlanClient";
import { getMajor, getMinor } from "@/lib/dal/catalog";
import { getCourseNamesBatch } from "@/lib/dal/courses";
import { Major, Minor, Requirement } from "@/lib/graduate/types";

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
  let majors: Major[] = [];
  let minors: Minor[] = [];

  if (catalogYear) {
    const [fetchedMajors, fetchedMinors] = await Promise.all([
      Promise.all(majorNames.map((m) => getMajor(catalogYear, m))),
      Promise.all(minorNames.map((m) => getMinor(catalogYear, m))),
    ]);

    majors = fetchedMajors.filter((m): m is Major => m !== null);
    minors = fetchedMinors.filter((m): m is Minor => m !== null);

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
      <GuestPlanClient
        initialCourseNames={courseNames}
        initialMajors={majors}
        initialMinors={minors}
      />
    </div>
  );
}
