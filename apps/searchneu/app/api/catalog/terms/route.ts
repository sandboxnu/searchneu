import { getTerms } from "@/lib/dal/terms";

/**
 * GET /api/terms
 *
 * returns all known terms grouped by college, sorted most-recent-first
 * within each group
 *
 * @returns 200 `GroupedTerms` — `{ neu: Term[], cps: Term[], law: Term[] }`
 */
export async function GET() {
  const terms = await getTerms();
  return Response.json(terms);
}
