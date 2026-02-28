import { getNupaths } from "@/lib/dal/nupaths";

/**
 * GET /api/catalog/nupaths
 *
 * returns all NUpath records
 *
 * @returns 200 `Nupath[]` — `{ id, short, code, name }[]`
 */
export async function GET() {
  const nupaths = await getNupaths();
  return Response.json(nupaths);
}
