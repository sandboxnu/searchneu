import { buildingsT } from "@sneu/db/schema";
import { sql } from "drizzle-orm";
import type { StaticConfig } from "../../schemas/scraper/static-config";
import type { Tx } from "../types";

export type BuildingResult = {
  codeMap: Map<string, number>;
  /** Building codes present in DB but not defined in the static config. */
  staleCodes: string[];
};

export async function upsertBuildings(
  tx: Tx,
  config: StaticConfig,
  campusCodeMap: Map<string, number>,
): Promise<BuildingResult> {
  const values = config.buildings.map((b) => {
    const campusId = campusCodeMap.get(b.campus);
    if (!campusId) {
      throw Error(`campus ${b.campus} not found`);
    }
    return { name: b.name, code: b.code, campus: campusId };
  });

  await tx
    .insert(buildingsT)
    .values(values)
    .onConflictDoUpdate({
      target: buildingsT.code,
      set: {
        name: sql.raw(`excluded.${buildingsT.name.name}`),
        campus: sql.raw(`excluded.${buildingsT.campus.name}`),
      },
    });

  const buildings = await tx
    .select({ id: buildingsT.id, code: buildingsT.code })
    .from(buildingsT);

  const codeMap = new Map<string, number>();
  for (const b of buildings) {
    codeMap.set(b.code, b.id);
  }

  const configCodes = new Set<string>();
  for (const sb of config.buildings) {
    configCodes.add(sb.code);
    const id = codeMap.get(sb.code);
    if (id !== undefined) {
      for (const alias of sb.aliases ?? []) {
        configCodes.add(alias);
        codeMap.set(alias, id);
      }
    }
  }

  const staleCodes = buildings
    .filter((b) => !configCodes.has(b.code))
    .map((b) => b.code);

  return { codeMap, staleCodes };
}
