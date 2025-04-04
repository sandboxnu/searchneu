import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import {
  termsTable,
  coursesTable,
  sectionsTable,
  subjectsTable,
} from "@/db/schema";
// TODO: replace with @next/env (for better next compat)
import { loadEnvFile } from "node:process";
import { TermScrape } from "./types";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";

const TERM = "202530";

// Entrypoint for the scraper
async function main() {
  const cachename = `term-${TERM}.json`;
  const existingCache = existsSync(cachename);

  let term;
  if (existingCache) {
    console.log("existing cache found");
    term = JSON.parse(readFileSync(cachename, "utf8"));
  } else {
    console.log("generating new scrape");
    // TODO: Scrape the term
    term = await scrapeTerm(TERM);

    // TODO: Save term to file
    writeFile(cachename, JSON.stringify(term), (err) => {
      if (err) console.log(err);
    });
  }

  // TODO: Save to db
  loadEnvFile("./.env");
  const db = drizzle(process.env.DATABASE_URL_DIRECT!);

  console.log("connected");
  await insertCourseData(term, db);

  // Generate the searching index
  // @ts-ignore
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS courses_search_idx ON courses
    USING bm25 (id, name, subject, "courseNumber")
    WITH (key_field='id',
        text_fields='{"name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}}}'
    );
`);
}

// insertCourseData takes a term scrape cache and inserts it
// into the database
async function insertCourseData(data: TermScrape, db: NeonHttpDatabase<any>) {
  await db.transaction(async (tx) => {
    await tx
      .insert(termsTable)
      .values({
        term: data.term.code,
        name: data.term.description,
      })
      .onConflictDoUpdate({
        target: termsTable.term,
        set: { name: data.term.description },
      });

    // Upsert subjects
    const subjectInserts = data.subjects.map((subjectCode) => ({
      term: data.term.code,
      code: subjectCode,
      name: subjectCode, // TODO: get subject name
    }));

    if (subjectInserts.length > 0) {
      await tx
        .insert(subjectsTable)
        .values(subjectInserts)
        .onConflictDoNothing();
    }

    for (const course of data.courses) {
      const courseInsertResult = await tx
        .insert(coursesTable)
        .values({
          term: course.term,
          subject: course.subject,
          name: course.name,
          courseNumber: course.courseNumber,
          description: course.description,
          minCredits: course.minCredits,
          maxCredits: course.maxCredits,
        })
        .returning({ id: coursesTable.id });

      const courseId = courseInsertResult[0]?.id;

      if (!courseId) {
        const existingCourse = await tx
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            eq(coursesTable.term, course.term) &&
              eq(coursesTable.subject, course.subject) &&
              eq(coursesTable.courseNumber, course.courseNumber),
          );

        if (existingCourse.length === 0) {
          throw new Error(
            `Failed to insert or find course: ${course.subject} ${course.courseNumber}`,
          );
        }

        const existingCourseId = existingCourse[0].id;

        for (const section of course.sections) {
          await tx
            .insert(sectionsTable)
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
            })
            .onConflictDoUpdate({
              target: sectionsTable.crn,
              set: {
                faculty: section.faculty,
                seatCapacity: section.seatCapacity,
                seatRemaining: section.seatRemaining,
                waitlistCapacity: section.waitlistCapacity,
                waitlistRemaining: section.waitlistRemaining,
                classType: section.classType,
                honors: section.honors,
                campus: section.campus,
              },
            });
        }
      } else {
        for (const section of course.sections) {
          await tx
            .insert(sectionsTable)
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
            })
            .onConflictDoUpdate({
              target: sectionsTable.crn,
              set: {
                faculty: section.faculty,
                seatCapacity: section.seatCapacity,
                seatRemaining: section.seatRemaining,
                waitlistCapacity: section.waitlistCapacity,
                waitlistRemaining: section.waitlistRemaining,
                classType: section.classType,
                honors: section.honors,
                campus: section.campus,
              },
            });
        }
      }
    }
  });

  return;
}

// Always assume this file is only every called directy
(async () => {
  await main();
})();
