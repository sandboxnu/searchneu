import { getSearchRooms } from "@/lib/dal/search";
import { NextRequest } from "next/server";
import * as z from "zod";

const CourseSearchQuerySchema = z.object({
  term: z.string().length(6),
  query: z.string(),
  buildings: z.string().toUpperCase().array(),
  campuses: z.string().array(),
  minCapacity: z.coerce.number().gte(-1).lt(1000),
  maxCapacity: z.coerce.number().gte(-1).lt(1000)
});

/**
 * GET /api/rooms/search?term=&q=&build=[]&camp=[]&nci=&xci=
 *
 * searches courses
 *
 * see the catalog `RoomSearchFilters` type for more parameter details
 *
 * @param term         - 6-character Banner term code, e.g. `"202510"`
 * @param q            - search query to use (optional)
 * @param building     - bulding name array
 * @param camp         - campus code array, e.g. `"Boston"` (optional)
 * @param nci          - minimum room capacity. -1 indicates no lower bound
 *                       (optional)
 * @param xci          - maximum room level. -1 indicates no upper bound
 *                       (optional)
 *
 * @returns 200 `RoomSearchResult[]`
 * @returns 400 if `term` not included or any part invalid
 */
export async function GET(req: NextRequest) {
  const parsed = CourseSearchQuerySchema.safeParse({
    term: req.nextUrl.searchParams.get("term"),
    query: req.nextUrl.searchParams.get("q") ?? "",
    buildings: req.nextUrl.searchParams.get("build") ?? [],
    campuses: req.nextUrl.searchParams.getAll("camp") ?? [],
    minCapacity: req.nextUrl.searchParams.get("nci") ?? -1,
    maxCapacity: req.nextUrl.searchParams.get("xci") ?? -1,
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
    buildings,
    campuses,
    minCapacity,
    maxCapacity,
  } = parsed.data;

  const results = await getSearchRooms({
    term,
    query,
    buildings,
    campuses,
    minCapacity,
    maxCapacity,
  });

  return Response.json(results);
}
