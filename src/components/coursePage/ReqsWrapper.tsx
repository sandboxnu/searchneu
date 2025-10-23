import { db } from "@/db";
import { coursesT } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { Requisite } from "@/scraper/reqs";
import { Requisites } from "./Requisites";

export type ReqBoxItem =
  | { type: "course"; subject: string; courseNumber: string; name?: string }
  | { type: "test"; name: string; score: number }
  | { type: "separator"};

function flattenRequisites(item: Requisite): ReqBoxItem[] {
  if ("type" in item && "items" in item) {
    const results: ReqBoxItem[] = [];
    if (item.type == "or") results.push({ type: "separator" });
    item.items.forEach((subItem, i) => {
      results.push(...flattenRequisites(subItem));
    });

    return results;
  }

  if ("subject" in item && "courseNumber" in item) {
    return [
      {
        type: "course",
        subject: item.subject,
        courseNumber: item.courseNumber,
      },
    ];
  }

  if ("name" in item && "score" in item) {
    return [{ type: "test", name: item.name, score: item.score }];
  }

  return [];
}

async function fetchCourseNames(
  term: string,
  courseRefs: { subject: string; courseNumber: string }[],
): Promise<Record<string, string>> {
  if (courseRefs.length === 0) return {};

  try {
    const conditions = courseRefs.map((ref) =>
      and(
        eq(coursesT.subject, ref.subject),
        eq(coursesT.courseNumber, ref.courseNumber),
      ),
    );

    const results = await db
      .select({
        subject: coursesT.subject,
        courseNumber: coursesT.courseNumber,
        name: coursesT.name,
      })
      .from(coursesT)
      .where(and(eq(coursesT.term, term), or(...conditions)));

    return results.reduce(
      (acc, course) => {
        acc[`${course.subject} ${course.courseNumber}`] = course.name;
        return acc;
      },
      {} as Record<string, string>,
    );
  } catch (error) {
    console.error("Failed to fetch course names:", error);
    return {};
  }
}

export async function ReqsWrapper({
  title,
  reqs,
  termId,
}: {
  title: string;
  reqs: Requisite;
  termId: string;
}) {
  console.log(reqs);
  const flattenReqs = flattenRequisites(reqs);
  console.log("Flatten: ", flattenReqs);
  const courseRefs = flattenReqs
    .filter((item) => item.type === "course")
    .map((item) => ({
      subject: item.subject,
      courseNumber: item.courseNumber,
    }));

  const courseNames = await fetchCourseNames(termId, courseRefs);

  const reqsWithCourseNames = flattenReqs.map((item) => {
    if (item.type === "course") {
      const key = `${item.subject} ${item.courseNumber}`;
      return {
        ...item,
        name: courseNames[key],
      };
    }
    return item;
  });

  return (
    <Requisites title={title} items={reqsWithCourseNames} termId={termId} />
  );
}
