import { getSearchCourses } from "@/lib/dal/search";
import { NextRequest } from "next/server";
import * as z from "zod";

const CourseSearchQuerySchema = z.object({
  term: z.string().length(6),
  query: z.string(),
  subjects: z.string().toUpperCase().array(),
  minCourseLevel: z.coerce.number().gte(-1).lt(10),
  maxCourseLevel: z.coerce.number().gte(-1).lt(10),
  nupaths: z.string().toUpperCase().array(),
  campuses: z.string().array(),
  classTypes: z.string().array(),
  honors: z.coerce.boolean(),
});

/**
 * GET /api/catalog/search?term=&q=&subj=[]&nci=&xci=&nupath=[]&camp=[]&clty=[]&honors=
 *
 * searches courses
 *
 * see the catalog `SearchFilters` type for more parameter details
 *
 * @param term         - 6-character Banner term code, e.g. `"202510"`
 * @param q            - search query to use (optional)
 * @param subj         - subject code array, e.g. `"CS"`. case-insensitive - normalized
 *                       to uppercase internally (optional)
 * @param nci          - minimum course level (thousands digit). -1 indicates no lower bound
 *                       (optional)
 * @param xci          - maximum course level (thousands digit). -1 indicates no upper bound
 *                       (optional)
 * @param nupath       - nupath code array, e.g. `"WI"`. case-insensitive - normalized
 * 			 to uppercase internally (optional)
 * @param camp         - campus code array, e.g. `"Boston"` (optional)
 * @param clty         - class type code array, e.g. `"Lab"` (optional)
 * @param honors       - boolean to only include courses with at least one honors section
 *                       (optional)
 *
 * @returns 200 `CourseSearchResult[]`
 * @returns 400 if `term` not included or any part invalid
 */
export async function GET(req: NextRequest) {
  const parsed = CourseSearchQuerySchema.safeParse({
    term: req.nextUrl.searchParams.get("term"),
    query: req.nextUrl.searchParams.get("q") ?? "",
    subjects: req.nextUrl.searchParams.getAll("subj") ?? [],
    minCourseLevel: req.nextUrl.searchParams.get("nci") ?? -1,
    maxCourseLevel: req.nextUrl.searchParams.get("xci") ?? -1,
    nupaths: req.nextUrl.searchParams.getAll("nupath") ?? [],
    campuses: req.nextUrl.searchParams.getAll("camp") ?? [],
    classTypes: req.nextUrl.searchParams.getAll("clty") ?? [],
    honors: req.nextUrl.searchParams.get("honors") ?? false,
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "invalid query parameters" },
      { status: 400 },
    );
  }

  const {
    term,
    query,
    subjects,
    minCourseLevel,
    maxCourseLevel,
    nupaths,
    campuses,
    classTypes,
    honors,
  } = parsed.data;

  const results = await getSearchCourses({
    term,
    query,
    subjects,
    minCourseLevel,
    maxCourseLevel,
    nupaths,
    campuses,
    classTypes,
    honors,
  });

  return Response.json(results);
}
