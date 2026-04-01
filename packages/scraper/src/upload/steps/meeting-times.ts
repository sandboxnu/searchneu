import * as z from "zod";
import { meetingTimesT } from "@sneu/db/schema";
import { eq } from "drizzle-orm";
import type { ScraperBannerMeetingTime } from "../../schemas/scraper/banner-cache";
import type { BuildingRoomMap } from "./rooms";
import { chunk, type Tx } from "../types";

export async function upsertMeetingTimes(
  tx: Tx,
  termId: number,
  meetingTimes: Map<string, z.infer<typeof ScraperBannerMeetingTime>[]>,
  sectionsMap: Map<string, number>,
  buildingRoomMap: BuildingRoomMap,
): Promise<number[]> {
  const values: {
    termId: number;
    sectionId: number;
    roomId: number | null;
    days: number[];
    startTime: number;
    endTime: number;
  }[] = [];

  for (const [crn, mts] of meetingTimes) {
    const sectionId = sectionsMap.get(crn);
    if (!sectionId) {
      throw Error(`section ${crn} not found`);
    }

    for (const mt of mts) {
      if (mt.final) continue;

      const building = buildingRoomMap.get(mt.building ?? "");
      const roomId = building?.rooms.get(mt.room ?? "") ?? null;

      values.push({
        termId,
        sectionId,
        roomId,
        days: mt.days,
        startTime: mt.startTime,
        endTime: mt.endTime,
      });
    }
  }

  for (const batch of chunk(values, 5000)) {
    await tx
      .insert(meetingTimesT)
      .values(batch)
      .onConflictDoNothing({
        target: [
          meetingTimesT.termId,
          meetingTimesT.sectionId,
          meetingTimesT.days,
          meetingTimesT.startTime,
          meetingTimesT.endTime,
        ],
      });
  }

  // Find stale meeting times in DB that are no longer in the scrape
  const existing = await tx
    .select({
      id: meetingTimesT.id,
      sectionId: meetingTimesT.sectionId,
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
    })
    .from(meetingTimesT)
    .where(eq(meetingTimesT.termId, termId));

  const scrapedKeys = new Set(
    values.map(
      (mt) =>
        `${mt.sectionId}-${mt.days.join(",")}-${mt.startTime}-${mt.endTime}`,
    ),
  );

  return existing
    .filter(
      (mt) =>
        !scrapedKeys.has(
          `${mt.sectionId}-${mt.days.join(",")}-${mt.startTime}-${mt.endTime}`,
        ),
    )
    .map((mt) => mt.id);
}
