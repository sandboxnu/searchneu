import { cache } from "react";
import {
  db,
  coursesT,
  sectionsT,
  meetingTimesT,
  courseNupathJoinT,
  nupathsT,
  roomsT,
  buildingsT,
  subjectsT,
  campusesT,
} from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  type SectionTableSection,
  type SectionTableRoom,
} from "@/components/catalog/SectionTable";

export const getCourse = cache(
  async (term: string, subject: string, courseNumber: string) => {
    return db
      .select({
        id: coursesT.id,
        name: coursesT.name,
        subject: coursesT.subject,
        courseNumber: coursesT.courseNumber,
        register: coursesT.register,
        description: coursesT.description,
        minCredits: coursesT.minCredits,
        maxCredits: coursesT.maxCredits,
        prereqs: coursesT.prereqs,
        coreqs: coursesT.coreqs,
        postreqs: coursesT.postreqs,
        updatedAt: coursesT.updatedAt,
        nupaths: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.short}), null)`,
        nupathNames: sql<
          string[]
        >`array_remove(array_agg(distinct ${nupathsT.name}), null)`,
      })
      .from(coursesT)
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .leftJoin(courseNupathJoinT, eq(coursesT.id, courseNupathJoinT.courseId))
      .leftJoin(nupathsT, eq(courseNupathJoinT.nupathId, nupathsT.id))
      .where(
        and(
          eq(coursesT.term, term),
          eq(subjectsT.code, subject),
          eq(coursesT.courseNumber, courseNumber),
        ),
      )
      .groupBy(
        coursesT.id,
        coursesT.name,
        coursesT.subject,
        coursesT.courseNumber,
        coursesT.register,
        coursesT.description,
        coursesT.minCredits,
        coursesT.maxCredits,
        coursesT.prereqs,
        coursesT.coreqs,
        coursesT.postreqs,
        coursesT.updatedAt,
      );
  },
);

export const getCourseSections = cache(async (courseId: number) => {
  return db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      campus: campusesT.name,
      honors: sectionsT.honors,
      classType: sectionsT.classType,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      // Meeting time data
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
      // Room data
      roomId: roomsT.id,
      roomNumber: roomsT.code,
      // Building data
      buildingId: buildingsT.id,
      buildingName: buildingsT.name,
    })
    .from(sectionsT)
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .leftJoin(roomsT, eq(meetingTimesT.roomId, roomsT.id))
    .leftJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
    .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
    .where(eq(sectionsT.courseId, courseId))
    .then((rows) => {
      // Group the rows by section and reconstruct the meetingTimes array
      const sectionMap = new Map<number, SectionTableSection>();

      for (const row of rows) {
        if (!sectionMap.has(row.id)) {
          sectionMap.set(row.id, {
            id: row.id,
            crn: row.crn,
            faculty: row.faculty,
            campus: row.campus,
            honors: row.honors,
            classType: row.classType,
            seatRemaining: row.seatRemaining,
            seatCapacity: row.seatCapacity,
            waitlistCapacity: row.waitlistCapacity,
            waitlistRemaining: row.waitlistRemaining,
            meetingTimes: [],
          });
        }

        // Add meeting time if it exists
        if (row.meetingTimeId && row.days && row.startTime && row.endTime) {
          const section = sectionMap.get(row.id)!;

          const room: SectionTableRoom | undefined =
            row.roomId && row.roomNumber
              ? {
                  id: row.roomId,
                  number: row.roomNumber,
                  building:
                    row.buildingId && row.buildingName
                      ? { id: row.buildingId, name: row.buildingName }
                      : undefined,
                }
              : undefined;

          section.meetingTimes.push({
            days: row.days,
            startTime: row.startTime,
            endTime: row.endTime,
            final: false, // You'll need to add this field to meetingTimesT if needed
            room,
            finalDate: undefined,
          });
        }
      }

      return Array.from(sectionMap.values());
    });
});
