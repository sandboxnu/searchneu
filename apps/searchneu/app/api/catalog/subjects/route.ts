import { getSubjects } from "@/lib/dal/subjects";

/**
 * GET /api/catalog/subjects
 *
 * returns all subjects available in the catalog
 *
 * @returns 200 `Subject[]` — `{ id, code, name }[]`
 */
export async function GET() {
  const subjects = await getSubjects();
  return Response.json(subjects);
}
