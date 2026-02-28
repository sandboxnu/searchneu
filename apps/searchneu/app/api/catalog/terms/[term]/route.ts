import { NextRequest } from "next/server";
import { getTerm } from "@/lib/dal/terms";
import * as z from "zod";

export const TermParamSchema = z.object({
  term: z
    .string()
    .length(6, "term must be a 6-character Banner term code (e.g. 202510)"),
});

/**
 * GET /api/terms/:term
 *
 * returns the full record for a single term including `activeUntil` and
 * `updatedAt`
 *
 * @param params.term - 6-character Banner term code, e.g. `"202510"`
 *
 * @returns 200 `TermDetail`
 * @returns 400 if `term` is not a valid 6-character code
 * @returns 404 if no term with that code exists
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ term: string }> },
) {
  const parsed = TermParamSchema.safeParse(await params);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid term parameter" },
      { status: 400 },
    );
  }

  const term = await getTerm(parsed.data.term);

  if (!term) {
    return Response.json(
      { error: `Term "${parsed.data.term}" not found` },
      { status: 404 },
    );
  }

  return Response.json(term);
}
