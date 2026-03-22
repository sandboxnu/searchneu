import { NextRequest } from "next/server";
import * as z from "zod";
import { getSectionsByTermRoomId } from "@/lib/dal/sections";

const RoomScheduleByTermId = z.object({
  term: z
    .string()
    .length(6, "term must be a 6-character Banner term code (e.g. 202510)"),
  id: z.coerce
      .number()
      .int("id must be an integer")
      .positive("id must be a positive integer"),
});

/**
 * GET /api/rooms?term=&id=
 *
 * returns an array of sections associated with a room in a given term (a "room schedule")
 * query parameters are required and must resolve to a room in a term.
 *
 * @param term         - 6-character Banner term code, e.g. `"202510"`
 * @param id           - numeric room ID (positive integer)
 *
 * @returns 200 room schedule
 * @returns 400 if any required query parameter is missing or invalid
 * @returns 404 if no matching room for the given term exists
 */
export async function GET(req: NextRequest) {
  const parsed = RoomScheduleByTermId.safeParse({
    term: req.nextUrl.searchParams.get("term"),
    id: req.nextUrl.searchParams.get("id")
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "invalid query parameters" },
      { status: 400 },
    );
  }

  const { term, id } = parsed.data;
  const schedule = await getSectionsByTermRoomId(term, id);

  if (!schedule) {
    return Response.json(
      {
        error: `Room ID "${id}" not found in term ${term}`,
      },
      { status: 404 },
    );
  }

  return Response.json(schedule);
}
