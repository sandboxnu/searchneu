import "server-only";
import { db, campusesT } from "@/lib/db";
import { cache } from "react";
import type { Campus } from "@/lib/catalog/types";

/**
 * returns all campuses. intended for populating campus filter options in the
 * search UI and for resolving campus names from section records
 *
 * campus records are static in practice (they only change when NEU
 * adds or removes a campus location) and should be aggressively cached
 * at the call site
 */
export const getCampuses = cache(async (): Promise<Campus[]> => {
  return db
    .select({
      id: campusesT.id,
      name: campusesT.name,
      code: campusesT.code,
      group: campusesT.group,
    })
    .from(campusesT);
});
