import { nupathsT } from "@sneu/db/schema";
import type { StaticConfig } from "../../schemas/scraper/static-config";
import type { Tx } from "../types";

export type NupathResult = {
  map: Map<string, number>;
  codes: Set<string>;
};

export async function upsertNupaths(
  tx: Tx,
  config: StaticConfig,
): Promise<NupathResult> {
  await tx
    .insert(nupathsT)
    .values(config.nupaths)
    .onConflictDoNothing({ target: nupathsT.short });

  const nupaths = await tx
    .select({ id: nupathsT.id, code: nupathsT.code })
    .from(nupathsT);

  const map = new Map<string, number>();
  for (const n of nupaths) {
    map.set(n.code, n.id);
  }

  // Register aliases
  for (const sn of config.nupaths) {
    const id = map.get(sn.code);
    if (id !== undefined) {
      for (const alias of sn.aliases ?? []) {
        map.set(alias, id);
      }
    }
  }

  // Build the set of all recognized nupath codes (primary + aliases)
  const codes = new Set<string>();
  for (const n of config.nupaths) {
    codes.add(n.code);
    for (const alias of n.aliases ?? []) {
      codes.add(alias);
    }
  }

  return { map, codes };
}
