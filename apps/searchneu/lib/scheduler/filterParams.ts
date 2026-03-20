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

  const desiredCampus = params.get("campuses");
  if (desiredCampus) {
    filters.desiredCampus = desiredCampus;
  }

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
  if (filters.desiredCampus) params.set("campuses", filters.desiredCampus);
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
