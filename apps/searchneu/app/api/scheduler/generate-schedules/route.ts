import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { getSectionsAndMeetingTimes } from "@/lib/scheduler/courseSections";
import { resolveCoreqGroups } from "@/lib/scheduler/coreqGroups";
import { buildCourseGroups } from "@/lib/scheduler/courseGroups";
import {
  scheduleHasRequiredNupaths,
  sectionPassesFilters,
} from "@/lib/scheduler/filters";
import { parseFiltersFromParams } from "@/lib/scheduler/filterParams";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// This route runs a combinatorial search without authentication, so the
// bound has to come from the request rather than from trusting the caller.
const MAX_COURSE_IDS = 40;

/** Matches the choices the add-course modal offers. */
const MAX_GROUPS = 6;

const requestSchema = z
  .object({
    lockedCourseIds: z.array(z.number().int().positive()),
    optionalCourseIds: z.array(z.number().int().positive()),
    numCourses: z.number().int().min(1).max(MAX_GROUPS).optional(),
  })
  .refine(
    (query) =>
      query.lockedCourseIds.length + query.optionalCourseIds.length <=
      MAX_COURSE_IDS,
    { message: `at most ${MAX_COURSE_IDS} courses can be scheduled at once` },
  );

const parseCourseIds = (raw: string | null): number[] =>
  (raw ?? "")
    .split(",")
    .filter((value) => value.length > 0)
    .map((value) => Number.parseInt(value, 10));

const parseCount = (raw: string | null): number | undefined =>
  raw === null || raw === "" ? undefined : Number.parseInt(raw, 10);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parsed = requestSchema.safeParse({
    lockedCourseIds: parseCourseIds(searchParams.get("lockedCourseIds")),
    optionalCourseIds: parseCourseIds(searchParams.get("optionalCourseIds")),
    numCourses: parseCount(searchParams.get("numCourses")),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { lockedCourseIds, optionalCourseIds, numCourses } = parsed.data;

  // The same parser the filter panel writes with, so the two cannot drift.
  const filters = parseFiltersFromParams(searchParams);

  try {
    const groupings = await resolveCoreqGroups([
      ...lockedCourseIds,
      ...optionalCourseIds,
    ]);

    const courseIds = groupings.flat();
    const sections = await Promise.all(
      courseIds.map(getSectionsAndMeetingTimes),
    );

    // Filtering sections before the search, rather than filtering the
    // schedules it produces, is what keeps a narrowed plan cheap: the search
    // is multiplicative in how many sections survive.
    const sectionsByCourseId = new Map(
      courseIds.map((courseId, index) => [
        courseId,
        sections[index].filter((section) =>
          sectionPassesFilters(section, filters),
        ),
      ]),
    );

    const groups = buildCourseGroups(groupings, sectionsByCourseId);

    // A group is locked when any of its courses is, since a coreq travels
    // with its parent. Deciding it here also means a group is never counted
    // as both locked and optional.
    const locked = new Set(lockedCourseIds);
    const isLocked = (group: { courseIds: number[] }) =>
      group.courseIds.some((courseId) => locked.has(courseId));

    // Grouping and filtering can both leave a plan with fewer groups than the
    // saved count asks for. Clamp instead of returning nothing, and leave the
    // saved setting alone so it recovers when filters are relaxed.
    const schedulable = groups.filter((group) => group.options.length > 0);
    const targetGroupCount =
      numCourses === undefined
        ? undefined
        : Math.min(numCourses, schedulable.length);

    const requiredNupaths = filters.nupaths ?? [];

    const schedules = generateSchedules(
      groups.filter(isLocked),
      groups.filter((group) => !isLocked(group)),
      {
        targetGroupCount,
        // The one requirement that cannot be settled section by section.
        accept:
          requiredNupaths.length > 0
            ? (sections) =>
                scheduleHasRequiredNupaths(sections, requiredNupaths)
            : undefined,
      },
    );

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error generating schedules:", error);
    return NextResponse.json(
      { error: "Failed to generate schedules" },
      { status: 500 },
    );
  }
}
