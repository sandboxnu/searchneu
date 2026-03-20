import { subjectsT } from "@sneu/db/schema";
import { sql } from "drizzle-orm";
import type { StaticConfig } from "../../schemas/scraper/static-config";
import type { Tx } from "../types";

export type SubjectResult = {
  map: Map<string, number>;
  /** Subject codes present in DB but not defined in the static config. */
  staleCodes: string[];
};

export async function upsertSubjects(
  tx: Tx,
  config: StaticConfig,
): Promise<SubjectResult> {
  const values = config.subjects.map((s) => ({
    code: s.code,
    name: s.description,
  }));

  await tx
    .insert(subjectsT)
    .values(values)
    .onConflictDoUpdate({
      target: subjectsT.code,
      set: {
        name: sql.raw(`excluded.${subjectsT.name.name}`),
      },
    });

  const subjects = await tx
    .select({ id: subjectsT.id, code: subjectsT.code })
    .from(subjectsT);

  const map = new Map<string, number>();
  for (const s of subjects) {
    map.set(s.code, s.id);
  }

  const configCodes = new Set<string>();
  for (const ss of config.subjects) {
    configCodes.add(ss.code);
    const id = map.get(ss.code);
    if (id !== undefined) {
      for (const alias of ss.aliases ?? []) {
        configCodes.add(alias);
        map.set(alias, id);
      }
    }
  }

  const staleCodes = subjects
    .filter((s) => !configCodes.has(s.code))
    .map((s) => s.code);

  return { map, staleCodes };
}
