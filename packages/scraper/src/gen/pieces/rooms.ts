import { consola } from "consola";
import type { BuildingSchedule, Section } from "../../types";

export async function parseRooms(sections: Section[]) {
  const buildingCampuses: { [building: string]: string } = {};
  const rooms = sections.reduce((acc, section) => {
    section.meetingTimes.forEach((meetingTime) => {
      const { building, room, startTime, endTime, days } = meetingTime;

      if (!building || !room) {
        consola.warn("skipping meetingTime with missing building/room", {
          sectionCrn: section.crn,
          meetingTime,
        });
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

    return acc;
  }, {} as BuildingSchedule);

  return [rooms, buildingCampuses] as const;
}
