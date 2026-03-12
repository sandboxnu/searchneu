import { getCampuses } from "@/lib/dal/campuses";

/**
 * GET /api/catalog/campuses
 *
 * returns all campus record
 *
 * @returns 200 `Campus[]` — `{ id, name, code, group }[]`
 */
export async function GET() {
  const campuses = await getCampuses();
  return Response.json(campuses);
}
