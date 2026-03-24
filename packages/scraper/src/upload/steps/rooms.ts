import * as z from "zod";
import { buildingsT, roomsT } from "@sneu/db/schema";
import type { ScraperBannerCache } from "../../schemas/scraper/banner-cache";
import type { StaticConfig } from "../../schemas/scraper/static-config";
import type { Tx } from "../types";

export type BuildingRoomMap = Map<
  string,
  { id: number; rooms: Map<string, number> }
>;

/**
 * Extracts rooms from section meeting times and upserts them.
 * Returns a map from building code → { building id, rooms: code → id }.
 */
export async function upsertRooms(
  tx: Tx,
  scrape: z.infer<typeof ScraperBannerCache>,
  buildingCodeMap: Map<string, number>,
  config: StaticConfig,
): Promise<BuildingRoomMap> {
  // Collect unique (building, room) pairs from meeting times
  const seen = new Set<string>();
  const values: { code: string; buildingId: number }[] = [];

  for (const sections of Object.values(scrape.sections)) {
    for (const section of sections) {
      for (const mt of section.meetingTimes) {
        if (!mt.building || !mt.room) continue;
        const key = `${mt.building}:${mt.room}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const buildingId = buildingCodeMap.get(mt.building);
        if (!buildingId) {
          throw Error(`building ${mt.building} not found`);
        }
        values.push({ code: mt.room, buildingId });
      }
    }
  }

  if (values.length > 0) {
    await tx.insert(roomsT).values(values).onConflictDoNothing();
  }

  // Build the building→rooms lookup from all DB data
  const buildings = await tx
    .select({ id: buildingsT.id, code: buildingsT.code })
    .from(buildingsT);
  const rooms = await tx
    .select({ id: roomsT.id, buildingId: roomsT.buildingId, code: roomsT.code })
    .from(roomsT);

  const map: BuildingRoomMap = new Map();
  for (const b of buildings) {
    const buildingRooms = rooms
      .filter((r) => r.buildingId === b.id)
      .reduce((agg, r) => agg.set(r.code, r.id), new Map<string, number>());
    map.set(b.code, { id: b.id, rooms: buildingRooms });
  }

  // Register building aliases so room lookups work for aliased building codes
  for (const sb of config.buildings) {
    const entry = map.get(sb.code);
    if (entry) {
      for (const alias of sb.aliases ?? []) {
        map.set(alias, entry);
      }
    }
  }

  return map;
}
