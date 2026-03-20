import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lockedCourseIdsStr = searchParams.get("lockedCourseIds");
    const optionalCourseIdsStr = searchParams.get("optionalCourseIds");
    const numCoursesStr = searchParams.get("numCourses");

    const lockedCourseIds = lockedCourseIdsStr
      ? lockedCourseIdsStr.split(",").map((id) => parseInt(id))
      : [];
    const optionalCourseIds = optionalCourseIdsStr
      ? optionalCourseIdsStr.split(",").map((id) => parseInt(id))
      : [];
    const numCourses = numCoursesStr ? parseInt(numCoursesStr) : undefined;

    if (!Array.isArray(lockedCourseIds) || !Array.isArray(optionalCourseIds)) {
      return NextResponse.json(
        { error: "Invalid course IDs" },
        { status: 400 },
      );
    }

    const schedules = await generateSchedules(
      lockedCourseIds,
      optionalCourseIds,
      numCourses,
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
