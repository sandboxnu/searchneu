import { SectionTableRoom } from "@/components/catalog/SectionTable";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  sectionsT,
  campusesT,
  meetingTimesT,
  roomsT,
  buildingsT,
  coursesT,
  subjectsT,
} from "../db";
import { TrackerSection } from "@/app/notifications/page";

export const getSectionInfo = async (
  sectionIds: number[],
  trackerMap: Map<number, { messageCount: number; messageLimit: number }>,
) => {
  if (sectionIds.length === 0) return [];

  const rows = await db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      faculty: sectionsT.faculty,
      campus: campusesT.name,
      seatRemaining: sectionsT.seatRemaining,
      seatCapacity: sectionsT.seatCapacity,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      // course info
      courseName: coursesT.name,
      courseRegister: coursesT.register,
      courseSubject: subjectsT.code,
      courseNumber: coursesT.courseNumber,
      // meeting time info
      meetingTimeId: meetingTimesT.id,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
      // room info
      roomId: roomsT.id,
      roomNumber: roomsT.code,
      // building info
      buildingId: buildingsT.id,
      buildingName: buildingsT.name,
    })
    .from(sectionsT)
    .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
    .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    .leftJoin(meetingTimesT, eq(sectionsT.id, meetingTimesT.sectionId))
    .leftJoin(roomsT, eq(meetingTimesT.roomId, roomsT.id))
    .leftJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
    .innerJoin(campusesT, eq(sectionsT.campus, campusesT.id))
    .where(inArray(sectionsT.id, sectionIds));

  const sectionMap = new Map<number, TrackerSection>();

  for (const row of rows) {
    let section = sectionMap.get(row.id);

    if (!section) {
      section = {
        id: row.id,
        crn: row.crn,
        messageCount: trackerMap.get(row.id)?.messageCount ?? 0,
        messageLimit: trackerMap.get(row.id)?.messageLimit ?? 3,
        faculty: row.faculty,
        campus: row.campus,
        courseName: row.courseName,
        courseRegister: row.courseRegister,
        courseSubject: row.courseSubject,
        courseNumber: row.courseNumber,
        seatRemaining: row.seatRemaining,
        seatCapacity: row.seatCapacity,
        waitlistCapacity: row.waitlistCapacity,
        waitlistRemaining: row.waitlistRemaining,
        meetingTimes: [],
      };
      sectionMap.set(row.id, section);
    }

    if (row.meetingTimeId != null) {
      const room: SectionTableRoom | undefined =
        row.roomId != null && row.roomNumber != null
          ? {
              id: row.roomId,
              number: row.roomNumber,
              building:
                row.buildingId != null && row.buildingName != null
                  ? { id: row.buildingId, name: row.buildingName }
                  : undefined,
            }
          : undefined;

      section.meetingTimes.push({
        days: row.days!,
        startTime: row.startTime!,
        endTime: row.endTime!,
        final: false,
        room,
        finalDate: undefined,
      });
    }
  }

  return Array.from(sectionMap.values());
};
