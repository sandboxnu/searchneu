import { getAllCoursesForTerm } from "@/lib/dal/catalog-courses";
import { NextRequest } from "next/server";
import * as z from "zod";

const AllCoursesQuerySchema = z.object({
  term: z.string().min(6).max(9),
});

/**
 * GET /api/catalog/courses/all?term=202510
 *
 * returns all courses for a given term with aggregated section data.
 * used by the client-side MiniSearch index to power catalog search.
 *
 * @param term - 6+ character Banner term code, e.g. `"202510"`
 *
 * @returns 200 `CourseSearchResult[]`
 * @returns 400 if `term` is missing or invalid
 */
export async function GET(req: NextRequest) {
  const parsed = AllCoursesQuerySchema.safeParse({
    term: req.nextUrl.searchParams.get("term"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "invalid query parameters" },
      { status: 400 },
    );
  }

  const results = await getAllCoursesForTerm(parsed.data.term);
  return Response.json(results);
}
