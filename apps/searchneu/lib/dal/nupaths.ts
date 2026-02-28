import "server-only";
import { db, nupathsT } from "@/lib/db";
import { cache } from "react";
import type { Nupath } from "@/lib/catalog/types";

export type { Nupath };

/**
 * returns all NUpath records.
 *
 * nupath records are static in practice (they only change when NEU
 * adds or removes a campus location) and should be aggressively cached
 * at the call site
 */
export const getNupaths = cache(async (): Promise<Nupath[]> => {
  return db
    .select({
      id: nupathsT.id,
      short: nupathsT.short,
      code: nupathsT.code,
      name: nupathsT.name,
    })
    .from(nupathsT);
});
