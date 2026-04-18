import type { Campus, Nupath } from "@/lib/catalog/types";
import type { ScheduleFilters } from "@/lib/scheduler/filters";

type Params = { get(name: string): string | null };

export function parseFiltersFromParams(params: Params): ScheduleFilters {
  const filters: ScheduleFilters = {
    includesRemote: params.get("remote") !== "false",
    includeHonors: params.get("honors") !== "false",
  };

  const startTime = params.get("startTime");
  if (startTime) {
    const v = parseInt(startTime);
    if (!isNaN(v)) filters.startTime = v;
  }

  const endTime = params.get("endTime");
  if (endTime) {
    const v = parseInt(endTime);
    if (!isNaN(v)) filters.endTime = v;
  }

  const freeDays = params.get("freeDays");
  if (freeDays) {
    const days = freeDays
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (days.length > 0) filters.specificDaysFree = days;
  }

  const nupaths = params.get("nupaths");
  if (nupaths) {
    const values = nupaths.split(",").filter(Boolean);
    if (values.length > 0) filters.nupaths = values;
  }

  const lockedCourseIds = params.get("lockedCourseIds");
  if (lockedCourseIds) {
    const ids = lockedCourseIds
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (ids.length > 0) filters.lockedCourseIds = new Set(ids);
  }

  filters.desiredCampus = params.get("campuses") || "Boston";

  const hiddenSectionIds = params.get("hiddenSectionIds");
  if (hiddenSectionIds) {
    const ids = hiddenSectionIds
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (ids.length > 0) filters.hiddenSectionIds = new Set(ids);
  }

  const numCourses = params.get("numCourses");
  if (numCourses) {
    const v = parseInt(numCourses);
    if (!isNaN(v)) filters.numCourses = v;
  }

  const minSeats = params.get("minSeats");
  if (minSeats) {
    const v = parseInt(minSeats);
    if (!isNaN(v) && v > 0) filters.minSeatsLeft = v;
  }

  return filters;
}

export function syncToUrl(filters: ScheduleFilters) {
  const params = new URLSearchParams(window.location.search);

  const filterKeys = [
    "startTime",
    "endTime",
    "freeDays",
    "nupaths",
    "honors",
    "remote",
    "minSeats",
    "hiddenSectionIds",
    "lockedCourseIds",
    "campuses",
    "numCourses",
  ];
  filterKeys.forEach((k) => params.delete(k));

  if (filters.startTime != null)
    params.set("startTime", String(filters.startTime));
  if (filters.endTime != null) params.set("endTime", String(filters.endTime));
  if (filters.specificDaysFree?.length)
    params.set("freeDays", filters.specificDaysFree.join(","));
  if (filters.nupaths?.length) params.set("nupaths", filters.nupaths.join(","));
  if (filters.includeHonors === false) params.set("honors", "false");
  if (filters.includesRemote === false) params.set("remote", "false");
  if (filters.hiddenSectionIds?.size)
    params.set(
      "hiddenSectionIds",
      Array.from(filters.hiddenSectionIds).join(","),
    );
  if (filters.lockedCourseIds?.size)
    params.set(
      "lockedCourseIds",
      Array.from(filters.lockedCourseIds).join(","),
    );
  if (filters.desiredCampus && filters.desiredCampus !== "Boston")
    params.set("campuses", filters.desiredCampus);
  if (filters.minSeatsLeft != null && filters.minSeatsLeft > 0)
    params.set("minSeats", String(filters.minSeatsLeft));
  if (filters.numCourses != null)
    params.set("numCourses", String(filters.numCourses));

  const search = params.toString();
  const url = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function parseCourseIdsFromParams(params: Params): number[] {
  const courseIds = params.get("courseIds");
  if (!courseIds) return [];
  return courseIds
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
}

export function syncCourseIdsToUrl(courseIds: number[]) {
  const params = new URLSearchParams(window.location.search);
  if (courseIds.length > 0) {
    params.set("courseIds", courseIds.join(","));
  } else {
    params.delete("courseIds");
  }
  const search = params.toString();
  const url = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function buildGeneratorUrl(
  plan: {
    id?: number;
    term: string;
    numCourses?: number | null;
    startTime: number | null;
    endTime: number | null;
    freeDays: string[];
    includeHonorsSections: boolean;
    includeRemoteSections: boolean;
    hideFilledSections: boolean;
    campus: number | null;
    nupaths: number[];
    courses: Array<{
      courseId: number;
      isLocked: boolean;
      sections: Array<{ sectionId: number; isHidden: boolean }>;
    }>;
  },
  campuses: Campus[],
  nupaths: Nupath[],
): string {
  const params = new URLSearchParams();

  if (plan.id != null) params.set("planId", String(plan.id));
  params.set("term", plan.term);

  const courseIds = plan.courses.map((c) => c.courseId);
  if (courseIds.length > 0) params.set("courseIds", courseIds.join(","));
  if (plan.startTime != null) params.set("startTime", String(plan.startTime));
  if (plan.endTime != null) params.set("endTime", String(plan.endTime));
  if (plan.freeDays?.length) params.set("freeDays", plan.freeDays.join(","));
  if (!plan.includeHonorsSections) params.set("honors", "false");
  if (!plan.includeRemoteSections) params.set("remote", "false");
  if (plan.hideFilledSections) params.set("minSeats", "1");

  if (plan.campus != null) {
    const campus = campuses.find((c) => c.id === plan.campus);
    if (campus && campus.name !== "Boston") params.set("campuses", campus.name);
  }

  if (plan.nupaths?.length) {
    const shorts = plan.nupaths
      .map((id) => nupaths.find((n) => n.id === id)?.short)
      .filter(Boolean);
    if (shorts.length > 0) params.set("nupaths", shorts.join(","));
  }

  if (plan.numCourses != null) {
    params.set("numCourses", String(plan.numCourses));
  }

  const lockedIds = plan.courses
    .filter((c) => c.isLocked)
    .map((c) => c.courseId);
  if (lockedIds.length > 0) params.set("lockedCourseIds", lockedIds.join(","));

  const hiddenIds = plan.courses.flatMap((c) =>
    c.sections.filter((s) => s.isHidden).map((s) => s.sectionId),
  );
  if (hiddenIds.length > 0) params.set("hiddenSectionIds", hiddenIds.join(","));

  return `/scheduler/generator?${params.toString()}`;
}
