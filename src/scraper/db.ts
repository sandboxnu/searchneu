import { NeonClient, NeonDatabase } from "drizzle-orm/neon-serverless";
import {
  termsT,
  coursesT,
  sectionsT,
  subjectsT,
  buildingsT,
  roomsT,
  meetingTimesT,
} from "@/db/schema";
import { TermScrape } from "./types";
import { logger } from "@/lib/logger";

export async function insertCourseData(
  data: TermScrape,
  db: NeonDatabase<Record<string, never>> & { $client: NeonClient },
) {
  await db.transaction(async (tx) => {
    // Insert term
    await tx.insert(termsT).values({
      term: data.term.code,
      name: data.term.description,
      activeUntil: new Date("2025-10-05T17:41:35+00:00"),
    });
    logger.info("term done");

    // Insert subjects
    const subjectInserts = data.subjects.map((subj) => ({
      term: data.term.code,
      code: subj.code,
      name: subj.description,
    }));
    if (subjectInserts.length > 0) {
      await tx.insert(subjectsT).values(subjectInserts);
    }
    logger.info("subjects done");

    // Insert buildings
    const buildingNames = Object.keys(data.rooms);
    const buildingInserts = buildingNames.map((name) => ({
      name,
      campus: data.buildingCampuses[name],
    }));

    const buildingResults = await tx
      .insert(buildingsT)
      .values(buildingInserts)
      .returning({ id: buildingsT.id, name: buildingsT.name });

    const buildingMap = new Map(buildingResults.map((b) => [b.name, b.id]));
    logger.info("buildings done");

    // Insert rooms
    const roomInserts: { buildingId: number; number: string }[] = [];
    for (const [buildingName, rooms] of Object.entries(data.rooms)) {
      const buildingId = buildingMap.get(buildingName);
      if (!buildingId) continue;

      const roomNumbers = Object.keys(rooms);
      for (const roomNumber of roomNumbers) {
        roomInserts.push({
          buildingId,
          number: roomNumber,
        });
      }
    }

    const roomResults = await tx.insert(roomsT).values(roomInserts).returning({
      id: roomsT.id,
      buildingId: roomsT.buildingId,
      number: roomsT.number,
    });

    // Create room lookup map: "buildingId-roomNumber" -> roomId
    const roomMap = new Map(
      roomResults.map((r) => [`${r.buildingId}-${r.number}`, r.id]),
    );
    logger.info("rooms done");

    // Insert courses and sections, track CRN to section ID mapping
    const crnToSectionIdMap = new Map<string, number>();

    for (const course of data.courses) {
      const courseInsertResult = await tx
        .insert(coursesT)
        .values({
          term: course.term,
          subject: course.subject,
          name: course.name,
          courseNumber: course.courseNumber,
          register: course.subject + " " + course.courseNumber,
          description: course.description,
          minCredits: String(course.minCredits),
          maxCredits: String(course.maxCredits),
          nupaths: course.nupath,
          prereqs: course.prereqs,
          coreqs: course.coreqs,
        })
        .returning({ id: coursesT.id });

      const courseId = courseInsertResult[0]?.id;

      for (const section of course.sections) {
        if (!section.faculty) {
          logger.info(section);
          continue;
        }

        const sectionResult = await tx
          .insert(sectionsT)
          .values({
            courseId: courseId,
            term: course.term,
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
          .returning({ id: sectionsT.id });

        const sectionId = sectionResult[0]?.id;
        if (sectionId) {
          crnToSectionIdMap.set(section.crn, sectionId);
        }
      }
    }
    logger.info("courses and sections done");

    // Insert meeting times
    const meetingTimeInserts: {
      sectionId: number;
      roomId: number | null;
      days: number[];
      term: string;
      startTime: number;
      endTime: number;
    }[] = [];

    for (const [buildingName, rooms] of Object.entries(data.rooms)) {
      const buildingId = buildingMap.get(buildingName);
      if (!buildingId) continue;

      for (const [roomNumber, schedules] of Object.entries(rooms)) {
        const roomId = roomMap.get(`${buildingId}-${roomNumber}`);
        if (!roomId) continue;

        for (const schedule of schedules) {
          const sectionId = crnToSectionIdMap.get(schedule.crn);
          if (!sectionId) continue;

          if (
            Number.isNaN(schedule.startTime) ||
            Number.isNaN(schedule.endTime) ||
            schedule.startTime == null ||
            schedule.endTime == null
          )
            continue;

          meetingTimeInserts.push({
            sectionId,
            roomId,
            term: data.term.code,
            days: schedule.days,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        }
      }
    }

    if (meetingTimeInserts.length > 0) {
      await tx.insert(meetingTimesT).values(meetingTimeInserts);
    }
    logger.info("meeting times done");
  });
}
