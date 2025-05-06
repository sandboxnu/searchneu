import type { NextRequest } from "next/server";
import Fuse from "fuse.js";
import { db } from "@/db";
import { coursesT, sectionsT } from "@/db/schema";
import { eq } from "drizzle-orm";

// WARN: this is a very experimental searching function. use with caution!

const config = {
  keys: ["name"],
};

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // parse all the potential params
  const query = params.get("q") ?? "";
  const term = params.get("term");
  const subjects = params.getAll("subj");
  // const nupaths = params.getAll("nupath");
  const campusFilter = params.getAll("camp");
  const classTypeFilter = params.getAll("clty");
  // const minCourseId = params.get("minCourseId");
  // const maxCourseId = params.get("maxCourseId");
  const honorsFilter = params.get("honors");

  if (!term) {
    return new Response("", {
      status: 400,
    });
  }

  const { list, index } = await generateFuse(term);
  const fuse = new Fuse(list, config, Fuse.parseIndex(index));
  const r = fuse.search(query);

  const results = r
    .filter(
      (r) =>
        (subjects ? subjects.includes(r.item.subject) : true) &&
        (campusFilter
          ? campusFilter.filter((x) => r.item.classType.includes(x))
          : true) &&
        (classTypeFilter
          ? classTypeFilter.filter((x) => r.item.classType.includes(x))
          : true) &&
        (honorsFilter ? r.item.honors : true),
    )
    .map((r) => ({
      ...r.item,
      minCredits: 0,
      maxCredits: 0,
      sectionsWithSeats: 0,
      totalSections: 0,
    }));

  return Response.json(results);
}

async function generateFuse(term: string) {
  "use cache";

  const courses = await db
    .select({
      id: coursesT.id,
      name: coursesT.name,
      subject: coursesT.subject,
      courseNumber: coursesT.courseNumber,
      nupaths: coursesT.nupaths,
    })
    .from(coursesT)
    .where(eq(coursesT.term, term));

  const sections = await db
    .select({
      courseId: sectionsT.courseId,
      campus: sectionsT.campus,
      classType: sectionsT.classType,
      honors: sectionsT.honors,
    })
    .from(sectionsT)
    .where(eq(sectionsT.term, term));

  const processed = [];
  for (const course of courses) {
    const sec = sections.filter((s) => s.courseId === course.id);
    const a = sec.reduce(
      (acc, s) => ({
        campus: acc.campus.add(s.campus),
        classType: acc.classType.add(s.classType),
        honors: acc.honors || s.honors,
      }),
      {
        campus: new Set<string>(),
        classType: new Set<string>(),
        honors: false,
      },
    );

    processed.push({
      name: course.name,
      subject: course.subject,
      courseNumber: course.courseNumber,
      nupaths: course.nupaths,
      campus: Array.from(a.campus),
      classType: Array.from(a.classType),
      honors: a.honors,
    });
  }

  return {
    list: processed,
    index: Fuse.createIndex(config.keys, processed).toJSON(),
  };
}
