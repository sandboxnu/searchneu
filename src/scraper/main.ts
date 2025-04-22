import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle, NeonClient, NeonDatabase } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { termsT, coursesT, sectionsT, subjectsT } from "@/db/schema";
import { loadEnvConfig } from "@next/env";
import { TermScrape } from "./types";
import path from "node:path";

const CACHE_PATH = "cache/";
const TERM = "202560";

// always assume this file is only every called directy
(async () => {
  await main();
})();

async function main() {
  const cachename = path.resolve(CACHE_PATH, `term-${TERM}.json`);
  const existingCache = existsSync(cachename);

  let term;
  if (existingCache) {
    console.log("existing cache found");
    term = JSON.parse(readFileSync(cachename, "utf8"));
  } else {
    console.log("generating new scrape");
    term = await scrapeTerm(TERM);

    writeFile(cachename, JSON.stringify(term), (err) => {
      if (err) console.log(err);
    });
  }

  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
  const db = drizzle({
    connection: process.env.DATABASE_URL_DIRECT!,
  });

  console.log("connected");
  await insertCourseData(term, db);

  // generate the searching index
  // BUG: this is being a little problematic - really we should just drop and reindex completely
  //   await db.execute(sql`
  //     CREATE INDEX IF NOT EXISTS courses_search_idx ON courses
  //     USING bm25 (id, name, subject, "courseNumber")
  //     WITH (key_field='id',
  //         text_fields='{"name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}}}'
  //     );
  // `);
}

// insertCourseData takes a term scrape cache and inserts it
// into the database
async function insertCourseData(
  data: TermScrape,
  db: NeonDatabase<Record<string, never>> & { $client: NeonClient },
) {
  await db.transaction(async (tx) => {
    await tx
      .insert(termsT)
      .values({
        term: data.term.code,
        name: data.term.description,
        // TODO: activeUntil
        activeUntil: new Date("2025-10-05T17:41:35+00:00"),
      })
      .onConflictDoUpdate({
        target: termsT.term,
        set: { name: data.term.description },
      });

    // upsert subjects
    const subjectInserts = data.subjects.map((subjectCode) => ({
      term: data.term.code,
      code: subjectCode,
      name: subjectCode, // TODO: get subject name
    }));

    if (subjectInserts.length > 0) {
      await tx.insert(subjectsT).values(subjectInserts).onConflictDoNothing();
    }

    for (const course of data.courses) {
      const courseInsertResult = await tx
        .insert(coursesT)
        .values({
          term: course.term,
          subject: course.subject,
          name: course.name,
          courseNumber: course.courseNumber,
          description: course.description,
          minCredits: String(course.minCredits),
          maxCredits: String(course.maxCredits),
          nupaths: course.nupath,
          prereqs: {},
          coreqs: {},
        })
        .returning({ id: coursesT.id });

      const courseId = courseInsertResult[0]?.id;

      if (!courseId) {
        const existingCourse = await tx
          .select({ id: coursesT.id })
          .from(coursesT)
          .where(
            eq(coursesT.term, course.term) &&
              eq(coursesT.subject, course.subject) &&
              eq(coursesT.courseNumber, course.courseNumber),
          );

        if (existingCourse.length === 0) {
          throw new Error(
            `Failed to insert or find course: ${course.subject} ${course.courseNumber}`,
          );
        }

        const existingCourseId = existingCourse[0].id;

        for (const section of course.sections) {
          if (!section.faculty) {
            console.log(section);
            continue;
          }
          await tx
            .insert(sectionsT)
            .values({
              courseId: existingCourseId,
              crn: section.crn,
              faculty: section.faculty,
              seatCapacity: section.seatCapacity,
              seatRemaining: section.seatRemaining,
              waitlistCapacity: section.waitlistCapacity,
              waitlistRemaining: section.waitlistRemaining,
              classType: section.classType,
              honors: section.honors,
              campus: section.campus,
              meetingTimes: section.meetingTimes,
            })
            .onConflictDoUpdate({
              target: sectionsT.crn,
              set: {
                faculty: section.faculty,
                seatCapacity: section.seatCapacity,
                seatRemaining: section.seatRemaining,
                waitlistCapacity: section.waitlistCapacity,
                waitlistRemaining: section.waitlistRemaining,
                classType: section.classType,
                honors: section.honors,
                campus: section.campus,
                meetingTimes: section.meetingTimes,
              },
            });
        }
      } else {
        for (const section of course.sections) {
          if (!section.faculty) {
            console.log(section);
            continue;
          }
          await tx
            .insert(sectionsT)
            .values({
              courseId: courseId,
              crn: section.crn,
              faculty: section.faculty,
              seatCapacity: section.seatCapacity,
              seatRemaining: section.seatRemaining,
              waitlistCapacity: section.waitlistCapacity,
              waitlistRemaining: section.waitlistRemaining,
              classType: section.classType,
              honors: section.honors,
              campus: section.campus,
              meetingTimes: section.meetingTimes,
            })
            .onConflictDoUpdate({
              target: sectionsT.crn,
              set: {
                faculty: section.faculty,
                seatCapacity: section.seatCapacity,
                seatRemaining: section.seatRemaining,
                waitlistCapacity: section.waitlistCapacity,
                waitlistRemaining: section.waitlistRemaining,
                classType: section.classType,
                honors: section.honors,
                campus: section.campus,
                meetingTimes: section.meetingTimes,
              },
            });
        }
      }
    }
  });

  return;
}
