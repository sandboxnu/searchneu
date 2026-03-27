import { campusesT } from "@sneu/db/schema";
import { sql } from "drizzle-orm";
import type { StaticConfig } from "../../schemas/scraper/static-config";
import type { Tx } from "../types";

export type CampusMaps = {
  nameMap: Map<string, number>;
  codeMap: Map<string, number>;
};

export type CampusResult = {
  maps: CampusMaps;
  /** Campus codes present in DB but not defined in the static config. */
  staleCodes: string[];
};

export async function upsertCampuses(
  tx: Tx,
  config: StaticConfig,
): Promise<CampusResult> {
  const values = config.campuses.map((c) => ({
    name: c.name,
    code: c.code,
    group: c.group,
  }));

  await tx
    .insert(campusesT)
    .values(values)
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
    })
    .from(campusesT);

  const nameMap = new Map<string, number>();
  const codeMap = new Map<string, number>();
  for (const c of campuses) {
    nameMap.set(c.name, c.id);
    codeMap.set(c.code, c.id);
  }

  // Build set of all known codes (primary + aliases) for alias registration
  // and drift detection
  const configCodes = new Set<string>();
  for (const sc of config.campuses) {
    configCodes.add(sc.code);
    const id = codeMap.get(sc.code);
    if (id !== undefined) {
      for (const alias of sc.aliases ?? []) {
        configCodes.add(alias);
        codeMap.set(alias, id);
        nameMap.set(alias, id);
      }
    }
  }

  const staleCodes = campuses
    .filter((c) => !configCodes.has(c.code))
    .map((c) => c.code);

  return { maps: { nameMap, codeMap }, staleCodes };
}
