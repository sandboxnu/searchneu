import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { TermScrape, Config } from "./types";
import * as schema from "@/db/schema";
import { eq, and, inArray, notInArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function insertConfigData(
  config: Config,
  db: NodePgDatabase<typeof schema> & { $client: Pool },
) {
  await db.transaction(async (tx) => {
    console.log("  → Inserting campuses and nupaths...");

    // Insert campuses (deduplicated)
    const uniqueCampuses = config.attributes.campus.reduce((acc, c) => {
      const key = c.name ?? c.code;
      if (!acc.has(key)) {
        acc.set(key, { name: key, group: c.group });
      }
      return acc;
    }, new Map<string, { name: string; group: string }>());

    if (uniqueCampuses.size > 0) {
      await tx
        .insert(schema.campusesT)
        .values(Array.from(uniqueCampuses.values()))
        .onConflictDoNothing();
    }

    // Insert NUPaths
    if (config.attributes.nupath.length > 0) {
      await tx
        .insert(schema.nupathsT)
        .values(
          config.attributes.nupath.map((n) => ({
            short: n.short,
            name: n.name,
          })),
        )
        .onConflictDoNothing();
    }

    logger.info("Config data inserted");
  });
}

export async function insertTermData(
  data: TermScrape,
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  attributes: Config["attributes"],
  activeUntil: Date,
) {
  await db.transaction(async (tx) => {
    const termCode = data.term.code;

    // Insert term
    console.log("  → Inserting term...");

    // Insert or update term
    await tx
      .insert(schema.termsT)
      .values({
        term: termCode,
        name: data.term.description,
        activeUntil: activeUntil,
      })
      .onConflictDoUpdate({
        target: schema.termsT.term,
        set: {
          name: data.term.description,
          activeUntil: activeUntil,
          updatedAt: new Date(),
        },
      });

    // Fetch NUPath mappings once
    const nupaths = await tx
      .select({ id: schema.nupathsT.id, short: schema.nupathsT.short })
      .from(schema.nupathsT);
    const nupathMap = new Map(nupaths.map((n) => [n.short, n.id]));

    // Build campus code to name mapping from attributes
    // The scraped data uses "code" but the database uses "name ?? code"
    const campusCodeToName = new Map<string, string>();
    for (const campus of attributes.campus) {
      const dbName = campus.name ?? campus.code;
      campusCodeToName.set(campus.code, dbName);
      // Also map the name to itself for direct matches
      if (campus.name) {
        campusCodeToName.set(campus.name, dbName);
      }
    }

    // Fetch all valid campuses from the database
    const campuses = await tx
      .select({ name: schema.campusesT.name })
      .from(schema.campusesT);
    const validCampusNames = new Set(campuses.map((c) => c.name));

    console.log("  → Inserting subjects...");

    // Insert subjects for this term
    if (data.subjects.length > 0) {
      const subjectChunks = chunk(
        data.subjects.map((s) => ({
          term: termCode,
          code: s.code,
          name: s.description,
        })),
        1000,
      );

      for (const subjectChunk of subjectChunks) {
        await tx
          .insert(schema.subjectsT)
          .values(subjectChunk)
          .onConflictDoNothing();
      }

      // Remove subjects not in the scrape
      const scrapedSubjectCodes = data.subjects.map((s) => s.code);
      if (scrapedSubjectCodes.length > 0) {
        await tx
          .delete(schema.subjectsT)
          .where(
            and(
              eq(schema.subjectsT.term, termCode),
              notInArray(schema.subjectsT.code, scrapedSubjectCodes),
            ),
          );
      }
    } else {
      await tx
        .delete(schema.subjectsT)
        .where(eq(schema.subjectsT.term, termCode));
    }

    logger.info(`Subjects for ${termCode} synced`);
    console.log("  → Inserting buildings...");

    const buildingNames = Object.keys(data.rooms);
    if (buildingNames.length > 0) {
      const buildingChunks = chunk(
        buildingNames.map((name) => ({
          name,
          campus: data.buildingCampuses[name],
        })),
        1000,
      );

      for (const buildingChunk of buildingChunks) {
        await tx
          .insert(schema.buildingsT)
          .values(buildingChunk)
          .onConflictDoNothing({
            target: [schema.buildingsT.campus, schema.buildingsT.name],
          });
      }
    }

    const buildings = await tx
      .select({
        id: schema.buildingsT.id,
        name: schema.buildingsT.name,
        campus: schema.buildingsT.campus,
      })
      .from(schema.buildingsT);

    const buildingMap = new Map(
      buildings.map((b) => [`${b.campus}-${b.name}`, b.id]),
    );

    logger.info("Buildings synced");

    // Insert rooms
    console.log("  → Inserting rooms...");
    const roomInserts: { buildingId: number; number: string }[] = [];
    for (const [buildingName, rooms] of Object.entries(data.rooms)) {
      const campus = data.buildingCampuses[buildingName];
      const buildingId = buildingMap.get(`${campus}-${buildingName}`);
      if (!buildingId) continue;

      for (const roomNumber of Object.keys(rooms)) {
        roomInserts.push({ buildingId, number: roomNumber });
      }
    }

    if (roomInserts.length > 0) {
      const roomChunks = chunk(roomInserts, 5000);
      for (const roomChunk of roomChunks) {
        await tx
          .insert(schema.roomsT)
          .values(roomChunk)
          .onConflictDoNothing({
            target: [schema.roomsT.buildingId, schema.roomsT.number],
          });
      }
    }

    const rooms = await tx
      .select({
        id: schema.roomsT.id,
        buildingId: schema.roomsT.buildingId,
        number: schema.roomsT.number,
      })
      .from(schema.roomsT);

    const roomMap = new Map(
      rooms.map((r) => [`${r.buildingId}-${r.number}`, r.id]),
    );

    logger.info("Rooms synced");
    console.log("  → Inserting courses and sections...");

    // Prepare course data
    if (data.courses.length === 0) {
      logger.info("No courses to process");
      await tx
        .delete(schema.coursesT)
        .where(eq(schema.coursesT.term, termCode));
      return;
    }

    // Prepare course and section data
    const courseInserts = data.courses.map((c) => ({
      term: termCode,
      subject: c.subject,
      name: c.name,
      courseNumber: c.courseNumber,
      register: `${c.subject} ${c.courseNumber}`,
      description: c.description,
      minCredits: String(c.minCredits),
      maxCredits: String(c.maxCredits),
      prereqs: c.prereqs,
      coreqs: c.coreqs,
      postreqs: c.postreqs,
    }));

    // Bulk upsert courses
    const courseChunks = chunk(courseInserts, 1000);
    const allCourseResults: Array<{
      id: number;
      subject: string;
      courseNumber: string;
    }> = [];

    for (const courseChunk of courseChunks) {
      const courseResults = await tx
        .insert(schema.coursesT)
        .values(courseChunk)
        .onConflictDoUpdate({
          target: [
            schema.coursesT.term,
            schema.coursesT.subject,
            schema.coursesT.courseNumber,
          ],
          set: {
            name: sql.raw(`excluded.${schema.coursesT.name.name}`),
            description: sql.raw(
              `excluded."${schema.coursesT.description.name}"`,
            ),
            minCredits: sql.raw(
              `excluded."${schema.coursesT.minCredits.name}"`,
            ),
            maxCredits: sql.raw(
              `excluded."${schema.coursesT.maxCredits.name}"`,
            ),
            prereqs: sql.raw(`excluded."${schema.coursesT.prereqs.name}"`),
            coreqs: sql.raw(`excluded."${schema.coursesT.coreqs.name}"`),
            postreqs: sql.raw(`excluded."${schema.coursesT.postreqs.name}"`),
            updatedAt: new Date(),
          },
        })
        .returning({
          id: schema.coursesT.id,
          subject: schema.coursesT.subject,
          courseNumber: schema.coursesT.courseNumber,
        });

      allCourseResults.push(...courseResults);
    }

    const courseMap = new Map(
      allCourseResults.map((c) => [`${c.subject}-${c.courseNumber}`, c.id]),
    );

    logger.info(`${allCourseResults.length} courses for ${termCode} upserted`);

    // Remove courses not in scrape
    const scrapedCourseKeys = data.courses.map(
      (c) => `${c.subject}-${c.courseNumber}`,
    );
    const allTermCourses = await tx
      .select({
        id: schema.coursesT.id,
        subject: schema.coursesT.subject,
        courseNumber: schema.coursesT.courseNumber,
      })
      .from(schema.coursesT)
      .where(eq(schema.coursesT.term, termCode));

    const coursesToDelete = allTermCourses
      .filter(
        (c) => !scrapedCourseKeys.includes(`${c.subject}-${c.courseNumber}`),
      )
      .map((c) => c.id);

    console.log("courses to be deleted: ", coursesToDelete);

    if (coursesToDelete.length > 0) {
      // Delete in chunks to avoid parameter limit
      const deleteChunks = chunk(coursesToDelete, 10000);
      for (const deleteChunk of deleteChunks) {
        // await tx
        //   .delete(schema.coursesT)
        //   .where(inArray(schema.coursesT.id, deleteChunk));
        continue; // TODO:
      }
      logger.info(`${coursesToDelete.length} courses deleted`);
    }

    // Bulk insert course-nupath relationships
    const courseNupathInserts: { courseId: number; nupathId: number }[] = [];
    for (const course of data.courses) {
      const courseId = courseMap.get(
        `${course.subject}-${course.courseNumber}`,
      );
      if (!courseId) continue;

      for (const nupathShort of course.nupath) {
        const nupathId = nupathMap.get(nupathShort);
        if (nupathId) {
          courseNupathInserts.push({ courseId, nupathId });
        }
      }
    }

    console.log("  → Inserting meeting times...");

    // Delete existing course-nupath joins for this term's courses
    const courseIds = Array.from(courseMap.values());
    if (courseIds.length > 0) {
      const deleteChunks = chunk(courseIds, 10000);
      for (const deleteChunk of deleteChunks) {
        await tx
          .delete(schema.courseNupathJoinT)
          .where(inArray(schema.courseNupathJoinT.courseId, deleteChunk));
      }

      if (courseNupathInserts.length > 0) {
        const nupathChunks = chunk(courseNupathInserts, 10000);
        for (const nupathChunk of nupathChunks) {
          await tx.insert(schema.courseNupathJoinT).values(nupathChunk);
        }
        logger.info(
          `${courseNupathInserts.length} course-nupath relationships inserted`,
        );
      }
    }

    logger.info(`Course NUPaths for ${termCode} synced`);

    const normalizeCampus = (campus: string | undefined | null): string => {
      if (!campus) return "Unknown";

      const mappedName = campusCodeToName.get(campus) ?? campus;
      if (validCampusNames.has(mappedName)) return mappedName;

      return "Unknown";
    };

    // Bulk upsert sections
    const sectionInserts: Array<{
      courseId: number;
      term: string;
      crn: string;
      faculty: string;
      seatCapacity: number;
      seatRemaining: number;
      waitlistCapacity: number;
      waitlistRemaining: number;
      classType: string;
      honors: boolean;
      campus: string;
    }> = [];

    const crnToCourseMap = new Map<string, number>();

    for (const course of data.courses) {
      const courseId = courseMap.get(
        `${course.subject}-${course.courseNumber}`,
      );
      if (!courseId) continue;

      for (const section of course.sections) {
        // if (!section.faculty) continue;

        sectionInserts.push({
          courseId,
          term: termCode,
          crn: section.crn,
          faculty: section.faculty,
          seatCapacity: section.seatCapacity,
          seatRemaining: section.seatRemaining,
          waitlistCapacity: section.waitlistCapacity,
          waitlistRemaining: section.waitlistRemaining,
          classType: section.classType,
          honors: section.honors,
          // campus: section.campus,
          campus: normalizeCampus(section.campus),
        });

        crnToCourseMap.set(section.crn, courseId);
      }
    }

    const sectionChunks = chunk(sectionInserts, 1000);
    const allSectionResults: Array<{ id: number; crn: string }> = [];

    for (const sectionChunk of sectionChunks) {
      const sectionResults = await tx
        .insert(schema.sectionsT)
        .values(sectionChunk)
        .onConflictDoUpdate({
          target: [schema.sectionsT.term, schema.sectionsT.crn],
          set: {
            faculty: sql.raw(`excluded."${schema.sectionsT.faculty.name}"`),
            seatCapacity: sql.raw(
              `excluded."${schema.sectionsT.seatCapacity.name}"`,
            ),
            seatRemaining: sql.raw(
              `excluded."${schema.sectionsT.seatRemaining.name}"`,
            ),
            waitlistCapacity: sql.raw(
              `excluded."${schema.sectionsT.waitlistCapacity.name}"`,
            ),
            waitlistRemaining: sql.raw(
              `excluded."${schema.sectionsT.waitlistRemaining.name}"`,
            ),
            classType: sql.raw(`excluded."${schema.sectionsT.classType.name}"`),
            honors: sql.raw(`excluded.${schema.sectionsT.honors.name}`),
            campus: sql.raw(`excluded.${schema.sectionsT.campus.name}`),
            updatedAt: new Date(),
          },
        })
        .returning({ id: schema.sectionsT.id, crn: schema.sectionsT.crn });

      allSectionResults.push(...sectionResults);
    }

    const sectionMap = new Map(allSectionResults.map((s) => [s.crn, s.id]));

    logger.info(
      `${allSectionResults.length} sections for ${termCode} upserted`,
    );

    // Remove sections not in scrape
    const scrapedCrns = sectionInserts.map((s) => s.crn);
    const allTermSections = await tx
      .select({ id: schema.sectionsT.id, crn: schema.sectionsT.crn })
      .from(schema.sectionsT)
      .where(eq(schema.sectionsT.term, termCode));

    const sectionsToDelete = allTermSections
      .filter((s) => !scrapedCrns.includes(s.crn))
      .map((s) => s.id);

    if (sectionsToDelete.length > 0) {
      const deleteChunks = chunk(sectionsToDelete, 10000);
      for (const deleteChunk of deleteChunks) {
        await tx
          .delete(schema.sectionsT)
          .where(inArray(schema.sectionsT.id, deleteChunk));
      }
      logger.info(`${sectionsToDelete.length} sections deleted`);
    }

    // Bulk insert meeting times
    const meetingTimeInserts: Array<{
      sectionId: number;
      roomId: number | null;
      term: string;
      days: number[];
      startTime: number;
      endTime: number;
    }> = [];

    // Track which CRNs have meeting times from rooms
    const crnsWithRooms = new Set<string>();

    // Process meeting times from room data (with room assignments)
    for (const [buildingName, rooms] of Object.entries(data.rooms)) {
      const campus = data.buildingCampuses[buildingName];
      const buildingId = buildingMap.get(`${campus}-${buildingName}`);

      for (const [roomNumber, schedules] of Object.entries(rooms)) {
        const roomId = buildingId
          ? (roomMap.get(`${buildingId}-${roomNumber}`) ?? null)
          : null;

        for (const schedule of schedules) {
          const sectionId = sectionMap.get(schedule.crn);
          if (!sectionId) continue;

          if (
            schedule.startTime == null ||
            schedule.endTime == null ||
            Number.isNaN(schedule.startTime) ||
            Number.isNaN(schedule.endTime)
          ) {
            continue;
          }

          meetingTimeInserts.push({
            sectionId,
            roomId,
            term: termCode,
            days: schedule.days,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });

          crnsWithRooms.add(schedule.crn);
        }
      }
    }

    // Process meeting times from sections without room assignments
    for (const course of data.courses) {
      for (const section of course.sections) {
        // Skip if we already processed this section's meeting times from room data
        if (crnsWithRooms.has(section.crn)) continue;

        const sectionId = sectionMap.get(section.crn);
        if (!sectionId) continue;

        // Check if section has meeting time data (e.g., from a meetings array)
        // Adjust this based on your actual data structure
        if (section.meetingTimes && Array.isArray(section.meetingTimes)) {
          for (const meeting of section.meetingTimes) {
            if (
              meeting.startTime == null ||
              meeting.endTime == null ||
              Number.isNaN(meeting.startTime) ||
              Number.isNaN(meeting.endTime) ||
              !meeting.days ||
              meeting.days.length === 0
            ) {
              continue;
            }

            meetingTimeInserts.push({
              sectionId,
              roomId: null, // No room assigned
              term: termCode,
              days: meeting.days,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
            });
          }
        }
      }
    }

    const sectionIds = Array.from(sectionMap.values());
    if (sectionIds.length > 0) {
      const deleteChunks = chunk(sectionIds, 10000);
      for (const deleteChunk of deleteChunks) {
        await tx
          .delete(schema.meetingTimesT)
          .where(
            and(
              eq(schema.meetingTimesT.term, termCode),
              inArray(schema.meetingTimesT.sectionId, deleteChunk),
            ),
          );
      }

      if (meetingTimeInserts.length > 0) {
        const meetingChunks = chunk(meetingTimeInserts, 5000);
        for (const meetingChunk of meetingChunks) {
          await tx
            .insert(schema.meetingTimesT)
            .values(meetingChunk)
            .onConflictDoNothing({
              target: [
                schema.meetingTimesT.term,
                schema.meetingTimesT.sectionId,
                schema.meetingTimesT.days,
                schema.meetingTimesT.startTime,
                schema.meetingTimesT.endTime,
              ],
            });
        }
        logger.info(
          `${meetingTimeInserts.length} meeting times inserted (including ${meetingTimeInserts.filter((m) => m.roomId === null).length} without room assignments)`,
        );
      } else {
        logger.info("No meeting times to insert");
      }
    }

    logger.info(`Meeting times for ${termCode} synced`);
  });
}
