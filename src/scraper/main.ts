import { scrapeTerm } from "./scrape";
import { existsSync, readFileSync, writeFile } from "node:fs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import {
  termsTable,
  coursesTable,
  sectionsTable,
  subjectsTable,
} from "@/db/schema";
// TODO: replace with @next/env (for better next compat)
import { loadEnvFile } from "node:process";

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
}

// insertCourseData takes a term scrape cache and inserts it
// into the database
async function insertCourseData(data, db) {
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
          courseNumber: course.courseNumber,
          description: course.description,
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
            })
            .onConflictDoUpdate({
              target: sectionsTable.crn,
              set: { faculty: section.faculty },
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
            })
            .onConflictDoUpdate({
              target: sectionsTable.crn,
              set: { faculty: section.faculty },
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
