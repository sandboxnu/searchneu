import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { TermScrape, Config } from "./types";
import * as schema from "@/db/schema";

function isValidNupath(code: string, config: Config) {
  return config.attributes.nupath.some((n) => n.short === code);
}

function convertCampus(code: string, config: Config): string {
  const campusConfig = config.attributes.campus.find((c) => c.code === code);
  if (!campusConfig) {
    throw new Error(
      `Invalid campus code: "${code}". Campus not found in config. Please add this campus to manifest.yaml before uploading.`,
    );
  }
  return campusConfig.name ?? campusConfig.code;
}

export async function insertCourseData(
  data: TermScrape,
  config: Config,
  db: NodePgDatabase<typeof schema> & {
    $client: Pool;
  },
) {
  // Validate all campuses before starting transaction
  const uniqueCampuses = new Set<string>();
  for (const course of data.courses) {
    for (const section of course.sections) {
      uniqueCampuses.add(section.campus);
    }
  }

  for (const campusCode of uniqueCampuses) {
    try {
      convertCampus(campusCode, config);
    } catch (error) {
      console.error(`\n❌ ${(error as Error).message}\n`);
      throw error;
    }
  }

  await db.transaction(async (tx) => {
    // Insert term
    console.log("  → Inserting term...");
    await tx
      .insert(schema.termsT)
      .values({
        term: data.term.code,
        name: data.term.description,
        activeUntil: new Date(
          config.terms.find((t) => t.term.toString() === data.term.code)
            ?.activeUntil ?? "2000-01-01",
        ),
      })
      .onConflictDoNothing();

    const filteredCampuses = config.attributes.campus.reduce(
      (agg, c) => {
        const count = agg.filter(
          (s: Config["attributes"]["campus"][0]) =>
            (s.name ?? s.code) === (c.name ?? c.code),
        );

        if (count.length > 0) return agg;
        agg.push(c);
        return agg;
      },
      [] as Config["attributes"]["campus"],
    );

    console.log("  → Inserting campuses and nupaths...");
    for (const campus of filteredCampuses) {
      await tx
        .insert(schema.campusesT)
        .values({
          name: campus.name ?? campus.code,
          group: campus.group,
        })
        .onConflictDoNothing();
    }

    for (const nupath of config.attributes.nupath) {
      await tx
        .insert(schema.nupathsT)
        .values({
          short: nupath.short,
          name: nupath.name,
        })
        .onConflictDoNothing();
    }

    const nupaths = await tx
      .select({ id: schema.nupathsT.id, short: schema.nupathsT.short })
      .from(schema.nupathsT);

    // Insert subjects
    console.log("  → Inserting subjects...");
    const subjectInserts = data.subjects.map((subj) => ({
      term: data.term.code,
      code: subj.code,
      name: subj.description,
    }));
    if (subjectInserts.length > 0) {
      await tx
        .insert(schema.subjectsT)
        .values(subjectInserts)
        .onConflictDoNothing();
    }

    // Insert buildings
    console.log("  → Inserting buildings...");
    const buildingNames = Object.keys(data.rooms);
    const buildingInserts = buildingNames.map((name) => ({
      name,
      campus: data.buildingCampuses[name],
    }));

    await tx
      .insert(schema.buildingsT)
      .values(buildingInserts)
      .onConflictDoNothing({
        target: [schema.buildingsT.campus, schema.buildingsT.name],
      });

    const buildings = await tx
      .select({
        id: schema.buildingsT.id,
        name: schema.buildingsT.name,
      })
      .from(schema.buildingsT);

    const buildingMap = new Map(buildings.map((b) => [b.name, b.id]));

    // Insert rooms
    console.log("  → Inserting rooms...");
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

    await tx
      .insert(schema.roomsT)
      .values(roomInserts)
      .onConflictDoNothing({
        target: [schema.roomsT.buildingId, schema.roomsT.number],
      });

    const rooms = await tx
      .select({
        id: schema.roomsT.id,
        buildingId: schema.roomsT.buildingId,
        number: schema.roomsT.number,
      })
      .from(schema.roomsT);

    // Create room lookup map: "buildingId-roomNumber" -> roomId
    const roomMap = new Map(
      rooms.map((r) => [`${r.buildingId}-${r.number}`, r.id]),
    );

    // Insert courses and sections, track CRN to section ID mapping
    console.log("  → Inserting courses and sections...");
    const crnToSectionIdMap = new Map<string, number>();

    for (const course of data.courses) {
      // Filter nupaths to only include valid ones from config
      const validNupaths = course.nupath.filter((n) =>
        isValidNupath(n, config),
      );

      const courseInsertResult = await tx
        .insert(schema.coursesT)
        .values({
          term: course.term,
          subject: course.subject,
          name: course.name,
          courseNumber: course.courseNumber,
          register: course.subject + " " + course.courseNumber,
          description: course.description,
          minCredits: String(course.minCredits),
          maxCredits: String(course.maxCredits),
          prereqs: course.prereqs,
          coreqs: course.coreqs,
        })
        .returning({ id: schema.coursesT.id })
        .onConflictDoUpdate({
          target: [
            schema.coursesT.term,
            schema.coursesT.subject,
            schema.coursesT.courseNumber,
          ],
          set: { updatedAt: new Date() },
        });

      for (const nupath of validNupaths) {
        const nupathId = nupaths?.find((c) => c.short === nupath)?.id;
        if (nupathId) {
          await tx
            .insert(schema.courseNupathJoinT)
            .values({
              courseId: courseInsertResult[0].id,
              nupathId: nupathId,
            })
            .onConflictDoNothing({
              target: [
                schema.courseNupathJoinT.courseId,
                schema.courseNupathJoinT.nupathId,
              ],
            });
        }
      }

      const courseId = courseInsertResult[0]?.id;

      for (const section of course.sections) {
        if (!section.faculty) {
          continue;
        }

        // Apply campus transformation here during upload
        const campusName = convertCampus(section.campus, config);

        const sectionResult = await tx
          .insert(schema.sectionsT)
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
            campus: campusName,
          })
          .returning({ id: schema.sectionsT.id })
          .onConflictDoUpdate({
            target: [schema.sectionsT.term, schema.sectionsT.crn],
            set: { updatedAt: new Date() },
          });

        const sectionId = sectionResult[0]?.id;
        if (sectionId) {
          crnToSectionIdMap.set(section.crn, sectionId);
        }
      }
    }

    // Insert meeting times
    console.log("  → Inserting meeting times...");
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
      await tx
        .insert(schema.meetingTimesT)
        .values(meetingTimeInserts)
        .onConflictDoNothing({
          target: [
            schema.meetingTimesT.term,
            schema.meetingTimesT.sectionId,
            schema.meetingTimesT.roomId,
            schema.meetingTimesT.days,
            schema.meetingTimesT.startTime,
            schema.meetingTimesT.endTime,
          ],
        });
    }
  });
}
