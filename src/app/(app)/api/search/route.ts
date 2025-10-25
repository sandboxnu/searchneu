import { getSearch } from "@/lib/controllers/getSearch";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // parse all the potential params
  const term = params.get("term");
  const query = params.get("q");
  const subjects = params.getAll("subj");
  const nupaths = params.getAll("nupath");
  const campusFilter = params.getAll("camp");
  const classTypeFilter = params.getAll("clty");
  const minCourseId = params.get("nci");
  const maxCourseId = params.get("xci");
  const honorsFilter = params.get("honors");

  if (!term) {
    return Response.json({ error: "term is required" });
  }

  if (query?.length && query.length > 0 && query.length < 4) {
    return Response.json({ error: "insufficient query length" });
  }

  let parsedMinId = -1;
  if (minCourseId) {
    try {
      const parsed = parseInt(minCourseId, 10);
      if (isNaN(parsed)) {
        return Response.json({ error: "minCourseId is NaN" });
      }
      parsedMinId = parsed;
    } catch {
      return Response.json({ error: "minCourseId is NaN" });
    }
  }

  let parsedMaxId = -1;
  if (maxCourseId) {
    try {
      const parsed = parseInt(maxCourseId, 10);
      if (isNaN(parsed)) {
        return Response.json({ error: "maxCourseId is NaN" });
      }
      parsedMaxId = parsed;
    } catch {
      return Response.json({ error: "maxCourseId is NaN" });
    }
  }

  const searchResults = await getSearch(
    term,
    query ?? "",
    subjects,
    parsedMinId,
    parsedMinId,
    nupaths,
    campusFilter,
    classTypeFilter,
    Boolean(honorsFilter),
  );

  return Response.json(searchResults);
}
