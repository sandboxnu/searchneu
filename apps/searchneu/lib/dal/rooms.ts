import "server-only";
import {
  db,
  meetingTimesT,
  roomsT,
  termsT,
} from "@/lib/db";
import { cache } from "react";
import type { AvailableRooms, Room } from "@/lib/catalog/types";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getTerms } from "./terms";

export const getRoomsFromBid = cache(
    async (bid : number): Promise<Room[]> => {
        return await db
          .select({
            id : roomsT.id, 
            number : roomsT.code,
            building: sql<undefined>`NULL`
          })
          .from(roomsT)
          .where(eq(roomsT.buildingId, bid))
    }
)

export const getNumAvailRoomsInBuilding = cache(
  async (day: number, time: number, bid: number): Promise<AvailableRooms> => {
    const roomsData = await db
          .select({
            roomId: roomsT.id,
            buildingId: roomsT.buildingId,
          })
          .from(roomsT)
          .where(eq(roomsT.buildingId, bid))
    
        const terms = await getTerms()
        const termId = terms.neu[0].id
    
    
    const roomIds = roomsData.map(r => r.roomId);
    const meetings = await db
        .select({
            roomId: meetingTimesT.roomId,
            days: meetingTimesT.days,
            startTime: meetingTimesT.startTime,
            endTime: meetingTimesT.endTime,
        })
        .from(meetingTimesT)
        .innerJoin(termsT, eq(meetingTimesT.termId, termsT.id))
        .where(and(
        inArray(meetingTimesT.roomId, roomIds),
        eq(termsT.id, termId)
        ));

    let earliestStartTimeAfter = Infinity
    let numAvail = 0

    for (const room of roomsData) {
        const assocMeetings = meetings.filter((m) => (m.roomId == room.roomId))

        const meetingsWithHours = assocMeetings.map((meeting) => ({
          ...meeting,
          startHour:
            Math.floor(meeting.startTime / 100),
          endHour:
            Math.floor(meeting.endTime / 100),
        }));

        const conflict = meetingsWithHours.filter((m) => (m.startHour < time && m.endHour > time && m.days.includes(day)))
        
        if (!conflict) {
            numAvail += 1
            const meetingsAfter = meetingsWithHours.filter((m) => (m.startHour > time && m.days.includes(day)))
            for (const meeting of meetingsAfter) {
                earliestStartTimeAfter = Math.min(earliestStartTimeAfter, meeting.startHour)
            }
        }
    }

    return {"numAvail": numAvail, "until": earliestStartTimeAfter}

  })