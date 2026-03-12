import { NextRequest } from "next/server";
import { getCourseByRegister } from "@/lib/dal/courses";
import * as z from "zod";

const CourseByRegisterQuerySchema = z.object({
  term: z
    .string()
    .length(6, "term must be a 6-character Banner term code (e.g. 202510)"),
  subject: z
    .string()
    .min(1, "subject is required")
    .max(6, "subject code must be at most 6 characters")
    .toUpperCase(),
  courseNumber: z
    .string()
    .min(1, "courseNumber is required")
    .max(6, "courseNumber must be at most 6 characters"),
});

/**
 * GET /api/catalog/courses?term=&subject=&courseNumber=
 *
 * returns a single course identified by its Banner register. all three
 * query parameters are required and must resolve to a course.
 *
 * @param term         - 6-character Banner term code, e.g. `"202510"`
 * @param subject      - subject code, e.g. `"CS"`. Case-insensitive — normalized
 *                       to uppercase internally
 * @param courseNumber - course number, e.g. `"3500"`
 *
 * @returns 200 `Course`
 * @returns 400 if any required query parameter is missing or invalid
 * @returns 404 if no matching course exists
 */
export async function GET(req: NextRequest) {
  const parsed = CourseByRegisterQuerySchema.safeParse({
    term: req.nextUrl.searchParams.get("term"),
    subject: req.nextUrl.searchParams.get("subject"),
    courseNumber: req.nextUrl.searchParams.get("courseNumber"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "invalid query parameters" },
      { status: 400 },
    );
  }

  const { term, subject, courseNumber } = parsed.data;
  const course = await getCourseByRegister(term, subject, courseNumber);

  if (!course) {
    return Response.json(
      {
        error: `course "${subject} ${courseNumber}" not found in term ${term}`,
      },
      { status: 404 },
    );
  }

  return Response.json(course);
}
