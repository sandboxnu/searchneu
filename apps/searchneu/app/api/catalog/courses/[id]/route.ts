import { NextRequest } from "next/server";
import { getCourseById } from "@/lib/dal/courses";
import * as z from "zod";

const CourseIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer"),
});

/**
 * GET /api/catalog/courses/:id
 *
 * returns the full detail record for a course by its numeric primary key,
 * including aggregated nupath codes and names
 *
 * @param params.id - numeric course ID (positive integer)
 *
 * @returns 200 `Course`
 * @returns 400 if `id` is not a valid positive integer
 * @returns 404 if no course with that ID exists
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = CourseIdParamSchema.safeParse(await params);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid course ID" },
      { status: 400 },
    );
  }

  const course = await getCourseById(parsed.data.id);

  if (!course) {
    return Response.json(
      { error: `Course with ID ${parsed.data.id} not found` },
      { status: 404 },
    );
  }

  return Response.json(course);
}
