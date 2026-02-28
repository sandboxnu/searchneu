import { NextRequest } from "next/server";
import { getSectionsByCourseId } from "@/lib/dal/sections";
import * as z from "zod";

const CourseIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer"),
});

/**
 * GET /api/catalog/courses/:id/sections
 *
 * returns all sections for a given course with each section's meeting times
 * pre-grouped.
 *
 * NOTE: this endpoint returns an empty array (not 404) when a course exists
 * but has no sections. a 404 only occurs when the `id` param fails validation;
 * callers should verify the parent course exists separately if needed.
 *
 * @param params.id - numeric course ID (positive integer)
 *
 * @returns 200 `Section[]` - may be empty if the course has no sections
 * @returns 400 if `id` is not a valid positive integer
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

  const sections = await getSectionsByCourseId(parsed.data.id);

  return Response.json(sections);
}
