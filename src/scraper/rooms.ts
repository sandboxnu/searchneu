import logger from "@/lib/logger";
import type { Course, BuildingSchedule } from "./types";

export async function parseRooms(courses: Course[]) {
  const buildingCampuses: { [building: string]: string } = {};
  const rooms = courses.reduce((acc, course) => {
    course.sections.forEach((section) => {
      section.meetingTimes.forEach((meetingTime) => {
        const { building, room, startTime, endTime, days } = meetingTime;

        if (!building || !room) {
          const courseId = course.subject ?? course.courseNumber;

          logger.warn(
            { courseId, sectionCrn: section.crn, meetingTime },
            "Skipping meetingTime with missing building/room",
          );
          return;
        }
        if (!acc[building]) {
          acc[building] = {};
          buildingCampuses[building] = section.campus;
        }

        if (!acc[building][room]) {
          acc[building][room] = [];
        }

        acc[building][room].push({
          crn: section.crn,
          startTime,
          endTime,
          days,
        });
      });
    });

    return acc;
  }, {} as BuildingSchedule);

  return [rooms, buildingCampuses];
}
