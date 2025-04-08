import { db } from "@/db";
import { coursesT } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // NOTE: puling cookies here just to get it dynamic for now
  const cookieStore = await cookies();
  const course = decodeURIComponent((await props.params)?.course) ?? "";

  const result = await db
    .select({
      name: coursesT.name,
      description: coursesT.description,
      creditsLow: coursesT.minCredits,
      creditsHigh: coursesT.maxCredits,
    })
    .from(coursesT)
    .where(
      and(
        eq(coursesT.courseNumber, course.split(" ")[1]),
        eq(coursesT.subject, course.split(" ")[0]),
      ),
    );

  if (result.length === 0) {
    return <p>course {course} not found</p>;
  }

  if (result.length > 1) {
    return <p>multiple courses matching {course} found!</p>;
  }

  return (
    <div className="py-8 px-6 flex-col gap-8 flex h-full bg-secondary border-l-[0.5px]">
      <div>
        <h1 className="font-semibold text-2xl">{course}</h1>
        <h2 className="">{result[0].name}</h2>
      </div>
      <div className="rounded bg-background shadow-sm py-4 px-5">
        <h3 className="text-secondary-foreground pb-3 text-sm">Description</h3>
        <p>{result[0].description}</p>
      </div>
    </div>
  );
}
