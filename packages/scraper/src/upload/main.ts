/**
 * uploads a cache to the db
 */

import * as z from "zod";
import { TermConfig } from "../config";
import {
  ScraperBannerCache,
  ScraperBannerMeetingTime,
} from "../schemas/scraper/banner-cache";
import { type createDbClient } from "@sneu/db/pg";
import {
  buildingsT,
  campusesT,
  courseNupathJoinT,
  coursesT,
  meetingTimesT,
  nupathsT,
  roomsT,
  sectionsT,
  subjectsT,
  termsT,
} from "@sneu/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ScraperEventEmitter } from "../events";

/**
 *
 *
 * @param cache
 * @param config scraper configuration
 * @param emitter optional event emitter for progress/status updates
 */
export async function uploadCatalogTerm(
  scrape: z.infer<typeof ScraperBannerCache>,
  db: ReturnType<typeof createDbClient>,
  config: z.infer<typeof TermConfig>,
  emitter?: ScraperEventEmitter,
): Promise<void> {
  emitter?.emit("upload:start", { term: scrape.term.code });
  await db.transaction(async (tx) => {
    // ===== fixed values =====
    // campuses
    // TODO: group config / support
    const campusValues = scrape.campuses.map((c) => {
      const code =
        c.code === "?" ? c.name.substring(0, 3).toUpperCase() : c.code;

      return {
        name: c.name,
        code: code,
        group: "",
      };
    });
    await tx
      .insert(campusesT)
      .values(campusValues)
      .onConflictDoUpdate({
        target: campusesT.name,
        set: {
          code: sql.raw(`excluded.${campusesT.code.name}`),
          group: sql.raw(`excluded.${campusesT.name.name}`),
        },
      });

    const campuses = await tx
      .select({
        id: campusesT.id,
        name: campusesT.name,
        code: campusesT.code,
        group: campusesT.group,
      })
      .from(campusesT);
    const campusNameMap = campuses.reduce(
      (agg, c) => agg.set(c.name, c.id),
      new Map<string, number>(),
    );
    const campusCodeMap = campuses.reduce(
      (agg, c) => agg.set(c.code, c.id),
      new Map<string, number>(),
    );
    emitter?.emit("upload:campuses:complete", { count: campuses.length });

    // buildings
    const buildingsValues = scrape.buildings.map((b) => {
      const campusId = campusCodeMap.get(b.campus);
      if (!campusCodeMap.has(b.campus) || !campusId) {
        throw Error(`campus ${b.campus} not found`);
      }
      return {
        name: b.name,
        code: b.code,
        campus: campusId,
      };
    });
    await tx.insert(buildingsT).values(buildingsValues).onConflictDoNothing();

    const buildings = await tx
      .select({
        id: buildingsT.id,
        name: buildingsT.name,
        code: buildingsT.code,
        campus: buildingsT.campus,
      })
      .from(buildingsT);
    const buildingCodeMap = buildings.reduce(
      (agg, b) => agg.set(b.code, b.id),
      new Map<string, number>(),
    );
    const buildingsMap = buildings.reduce(
      (agg, b) => agg.set(b.name, b.id),
      new Map<string, number>(),
    );
    emitter?.emit("upload:buildings:complete", { count: buildings.length });

    // rooms
    const roomsValues = scrape.rooms.map((r) => {
      const buildingId = buildingCodeMap.get(r.building);
      if (!buildingCodeMap.has(r.building) || !buildingId) {
        throw Error(`building ${r.building} not found`);
      }
      return {
        code: r.code,
        buildingId: buildingId,
      };
    });
    await tx.insert(roomsT).values(roomsValues).onConflictDoNothing();

    const rooms = await tx
      .select({
        id: roomsT.id,
        buildingId: roomsT.buildingId,
        code: roomsT.code,
      })
      .from(roomsT);
    const roomsMap = rooms.reduce(
      (agg, r) => agg.set(r.code, r.id),
      new Map<string, number>(),
    );
    const buildingRoomMap = buildings.reduce(
      (agg, b) => agg.set(b.name, { id: b.id, rooms: roomsMap }),
      new Map<string, { id: number; rooms: Map<string, number> }>(),
    );

    // nupaths
    const nupaths = [
      { code: "NCND", short: "ND", name: "Natural/Designed World" },
      { code: "NCEI", short: "EI", name: "Creative Express/Innov" },
      { code: "NCIC", short: "IC", name: "Interpreting Culture" },
      { code: "NCFQ", short: "FQ", name: "Formal/Quant Reasoning" },
      { code: "NCSI", short: "SI", name: "Societies/Institutions" },
      { code: "NCAD", short: "AD", name: "Analyzing/Using Data" },
      { code: "NCDD", short: "DD", name: "Difference/Diversity" },
      { code: "NCER", short: "ER", name: "Ethical Reasoning" },
      { code: "NCW1", short: "WF", name: "First Year Writing" },
      { code: "NCWI", short: "WI", name: "Writing Intensive" },
      { code: "NCW2", short: "WD", name: "Advanced Writing" },
      { code: "NCEX", short: "EX", name: "Integration Experience" },
      { code: "NCCE", short: "CE", name: "Capstone Experience" },
    ];
    await tx
      .insert(nupathsT)
      .values(nupaths)
      .onConflictDoNothing({ target: nupathsT.short });

    const nupathsV = await tx
      .select({
        id: nupathsT.id,
        code: nupathsT.code,
        short: nupathsT.short,
      })
      .from(nupathsT);
    const nupathsMap = nupathsV.reduce((agg, n) => {
      return agg.set(n.code, n.id);
    }, new Map<string, number>());

    // subjects
    // NOTE: there prob should be a subjects -> term mapping to be able to pull just
    // the subjects in a particular term
    const subjectInserts = scrape.subjects.map((s) => ({
      code: s.code,
      name: s.description,
    }));
    await tx.insert(subjectsT).values(subjectInserts).onConflictDoNothing();

    const subjects = await tx
      .select({ id: subjectsT.id, code: subjectsT.code, name: subjectsT.name })
      .from(subjectsT);
    const subjectsMap = subjects.reduce(
      (agg, s) => agg.set(s.code, s.id),
      new Map<string, number>(),
    );
    emitter?.emit("upload:subjects:complete", { count: subjects.length });

    // ===== term specific values =====
    // term
    await tx
      .insert(termsT)
      .values({
        term: scrape.term.code,
        name: scrape.term.description,
        activeUntil: new Date(config.activeUntil),
      })
      .onConflictDoUpdate({
        target: termsT.term,
        set: {
          name: scrape.term.description,
          activeUntil: new Date(config.activeUntil),
        },
      });
    emitter?.emit("upload:term:complete", { term: scrape.term.code });

    // courses
    // TODO: special topics
    const courseValues = scrape.courses.map((c) => {
      const subjectId = subjectsMap.get(c.subject);

      if (!subjectsMap.has(c.subject) || !subjectId) {
        throw Error(`subject ${c.subject} not found`);
      }

      return {
        term: scrape.term.code,
        name: c.name,
        subject: subjectId,
        courseNumber: c.courseNumber,
        register: c.subject + c.courseNumber,
        description: c.description,
        minCredits: String(c.minCredits),
        maxCredits: String(c.maxCredits),
        prereqs: c.prereqs,
        coreqs: c.coreqs,
        postreqs: c.postreqs,
      };
    });
    const courseChunks = chunk(courseValues, 5000);
    for (const chunk of courseChunks) {
      await tx
        .insert(coursesT)
        .values(chunk)
        .onConflictDoUpdate({
          target: [coursesT.term, coursesT.subject, coursesT.courseNumber],
          set: {
            name: sql.raw(`excluded.${coursesT.name.name}`),
            description: sql.raw(`excluded."${coursesT.description.name}"`),
            minCredits: sql.raw(`excluded."${coursesT.minCredits.name}"`),
            maxCredits: sql.raw(`excluded."${coursesT.maxCredits.name}"`),
            prereqs: sql.raw(`excluded."${coursesT.prereqs.name}"`),
            coreqs: sql.raw(`excluded."${coursesT.coreqs.name}"`),
            postreqs: sql.raw(`excluded."${coursesT.postreqs.name}"`),
          },
        });
    }

    const courses = await tx
      .select({
        id: coursesT.id,
        subject: subjectsT.code,
        courseNumber: coursesT.courseNumber,
      })
      .from(coursesT)
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .where(eq(coursesT.term, scrape.term.code));
    const courseMap = courses.reduce(
      (agg, c) => agg.set(c.subject + c.courseNumber, c.id),
      new Map<string, number>(),
    );
    emitter?.emit("upload:courses:complete", { count: courses.length });

    // sections
    const meetingtimes: Map<
      string,
      z.infer<typeof ScraperBannerMeetingTime>[]
    > = new Map();
    const sectionValues = Object.entries(scrape.sections)
      .map(([courseRegister, sections]) => {
        return sections.map((s) => {
          // get all the meeting times
          if (meetingtimes.has(s.crn)) {
            throw Error(`crn ${s.crn} is already used`);
          }

          meetingtimes.set(s.crn, s.meetingTimes);

          // get the ids from the string identifiers
          const courseId = courseMap.get(courseRegister);

          if (!courseMap.has(courseRegister) || !courseId) {
            throw Error(`course ${courseRegister} not found`);
          }

          // HACK: tf is this
          const campusId = campusNameMap.get(
            s.campus === "Nahant" ? "Boston" : s.campus,
          );

          // if (!campusNameMap.has(s.campus) || !campusId) {
          if (!campusId) {
            throw Error(`campus ${s.campus} not found`);
          }

          const facultyObj = s.faculty.filter((f) => f.primary);
          let faculty = "NA";
          if (facultyObj.length === 1) {
            faculty = facultyObj[0].displayName;
          }

          return {
            term: scrape.term.code,
            courseId: courseId,
            crn: s.crn,
            faculty: faculty,
            seatCapacity: s.seatCapacity,
            seatRemaining: s.seatRemaining,
            waitlistCapacity: s.waitlistCapacity,
            waitlistRemaining: s.waitlistRemaining,
            classType: s.classType,
            honors: s.honors,
            campus: campusId,
          };
        });
      })
      .flat();

    const sectionChunks = chunk(sectionValues, 5000);
    for (const chunk of sectionChunks) {
      await tx
        .insert(sectionsT)
        .values(chunk)
        .onConflictDoUpdate({
          target: [sectionsT.term, sectionsT.crn],
          set: {
            faculty: sql.raw(`excluded."${sectionsT.faculty.name}"`),
            seatCapacity: sql.raw(`excluded."${sectionsT.seatCapacity.name}"`),
            seatRemaining: sql.raw(
              `excluded."${sectionsT.seatRemaining.name}"`,
            ),
            waitlistCapacity: sql.raw(
              `excluded."${sectionsT.waitlistCapacity.name}"`,
            ),
            waitlistRemaining: sql.raw(
              `excluded."${sectionsT.waitlistRemaining.name}"`,
            ),
            classType: sql.raw(`excluded."${sectionsT.classType.name}"`),
            honors: sql.raw(`excluded.${sectionsT.honors.name}`),
            campus: sql.raw(`excluded.${sectionsT.campus.name}`),
          },
        });
    }

    const sections = await tx
      .select({
        id: sectionsT.id,
        crn: sectionsT.crn,
      })
      .from(sectionsT)
      .where(eq(sectionsT.term, scrape.term.code));
    const sectionsMap = sections.reduce(
      (agg, s) => agg.set(s.crn, s.id),
      new Map<string, number>(),
    );

    // find sections in database but not in scrape
    const scrapedCrns = new Set(sectionValues.map((s) => s.crn));
    const sectionsToRemove = sections.filter((s) => !scrapedCrns.has(s.crn));
    const sectionIdsToRemove = sectionsToRemove.map((s) => s.id);

    emitter?.emit("upload:sections:complete", { count: sections.length });
    if (sectionIdsToRemove.length > 0) {
      emitter?.emit("upload:sections:removed", {
        count: sectionIdsToRemove.length,
        crns: sectionsToRemove.map((s) => s.crn),
      });
    }

    // nupath course mappings
    const nupathCodes = nupaths.reduce(
      (agg, n) => agg.add(n.code),
      new Set<string>(),
    );
    const nupathCourseMappings: { courseId: number; nupathId: number }[] = [];
    for (const c of scrape.courses) {
      const attrs = c.attributes;
      for (const a of attrs) {
        if (nupathCodes.has(a)) {
          const courseId = courseMap.get(c.subject + c.courseNumber);
          if (!courseId) {
            throw Error(
              "cannot find course id for " + c.subject + c.courseNumber,
            );
          }
          const nupathId = nupathsMap.get(a);
          if (!nupathId) {
            throw Error(`cannot find nupath ${a}`);
          }

          nupathCourseMappings.push({
            courseId: courseId,
            nupathId: nupathId,
          });
        }
      }
    }

    const nucChunks = chunk(nupathCourseMappings, 5000);
    for (const chunk of nucChunks) {
      await tx
        .insert(courseNupathJoinT)
        .values(chunk)
        .onConflictDoNothing({
          target: [courseNupathJoinT.courseId, courseNupathJoinT.nupathId],
        });
    }

    // meeting times
    const meetingTimeValues: {
      term: string;
      sectionId: number;
      roomId: number | null;
      days: number[];
      startTime: number;
      endTime: number;
    }[] = [];
    for (const [crn, mts] of meetingtimes) {
      for (const mt of mts) {
        if (mt.final) continue; // skip finals (for now at least)

        // if the building or room is not found let the null bubble up
        const buildingId = buildingRoomMap.get(mt.building ?? "");
        const roomId = buildingId?.rooms.get(mt.room ?? "");

        const sectionId = sectionsMap.get(crn);
        if (!sectionsMap.has(crn) || !sectionId) {
          throw Error(`section ${crn} not found`);
        }

        meetingTimeValues.push({
          term: scrape.term.code,
          sectionId: sectionId,
          roomId: roomId ?? null,
          days: mt.days,
          startTime: mt.startTime,
          endTime: mt.endTime,
        });
      }
    }

    const mtChunks = chunk(meetingTimeValues, 5000);
    for (const chunk of mtChunks) {
      await tx
        .insert(meetingTimesT)
        .values(chunk)
        .onConflictDoNothing({
          target: [
            meetingTimesT.term,
            meetingTimesT.sectionId,
            meetingTimesT.days,
            meetingTimesT.startTime,
            meetingTimesT.endTime,
          ],
        });
    }

    // find meeting times in database but not in scrape
    const existingMeetingTimes = await tx
      .select({
        id: meetingTimesT.id,
        sectionId: meetingTimesT.sectionId,
        days: meetingTimesT.days,
        startTime: meetingTimesT.startTime,
        endTime: meetingTimesT.endTime,
      })
      .from(meetingTimesT)
      .where(eq(meetingTimesT.term, scrape.term.code));

    // Create a set of scraped meeting time keys for comparison
    const scrapedMeetingTimeKeys = new Set(
      meetingTimeValues.map(
        (mt) =>
          `${mt.sectionId}-${mt.days.join(",")}-${mt.startTime}-${mt.endTime}`,
      ),
    );

    const meetingTimesToRemove = existingMeetingTimes.filter(
      (mt) =>
        !scrapedMeetingTimeKeys.has(
          `${mt.sectionId}-${mt.days.join(",")}-${mt.startTime}-${mt.endTime}`,
        ),
    );
    const meetingTimeIdsToRemove = meetingTimesToRemove.map((mt) => mt.id);

    emitter?.emit("upload:meetingtimes:complete", {
      count: meetingTimeValues.length,
    });
    if (meetingTimeIdsToRemove.length > 0) {
      emitter?.emit("upload:meetingtimes:removed", {
        count: meetingTimeIdsToRemove.length,
      });
    }

    emitter?.emit("upload:complete", { term: scrape.term.code });
  });
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
