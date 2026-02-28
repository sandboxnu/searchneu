import "server-only";
import {
  db,
  sectionsT,
  meetingTimesT,
  roomsT,
  buildingsT,
  campusesT,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";
import type { Room, Section } from "@/lib/catalog/types";

/**
 * returns all sections for a given course, with each section's meeting times
 * pre-grouped into a nested array
 *
 * sections with no assigned room (e.g. online sections) will have `room: undefined`
 * on their meeting time entries.
 *
 * @param courseId - the numeric primary key of the parent course
 */
export const getSectionsByCourseId = cache(
  async (courseId: number): Promise<Section[]> => {
    const rows = await db
      .select({
        // section fields
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
        // meeting time fields
        meetingTimeId: meetingTimesT.id,
        days: meetingTimesT.days,
        startTime: meetingTimesT.startTime,
        endTime: meetingTimesT.endTime,
        // room fields (nullable - not all sections have an assigned room)
        roomId: roomsT.id,
        roomNumber: roomsT.code,
        // building fields (nullable - follows room nullability)
        buildingId: buildingsT.id,
        buildingName: buildingsT.name,
      })
      .from(sectionsT)
      .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
      .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
      .leftJoin(roomsT, eq(meetingTimesT.roomId, roomsT.id))
      .leftJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
      .where(eq(sectionsT.courseId, courseId));

    // collapse the flat join result into one Section per section ID
    const sectionMap = new Map<number, Section>();

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

      // only attach a meeting time if all required fields are present -
      // a section with no meeting times at all will produce one null row from
      // the left join (skipped here)
      if (
        row.meetingTimeId !== null &&
        row.days &&
        row.startTime &&
        row.endTime
      ) {
        const section = sectionMap.get(row.id)!;

        const room: Room | undefined =
          row.roomId !== null && row.roomNumber
            ? {
                id: row.roomId,
                number: row.roomNumber,
                building:
                  row.buildingId !== null && row.buildingName
                    ? { id: row.buildingId, name: row.buildingName }
                    : undefined,
              }
            : undefined;

        section.meetingTimes.push({
          days: row.days,
          startTime: row.startTime,
          endTime: row.endTime,
          room,
        });
      }
    }

    return Array.from(sectionMap.values());
  },
);
