import "server-only";
import { db, subjectsT } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";
import type { Subject } from "@/lib/catalog/types";

/**
 * returns all subjects. there are no order guaruntees (effectively
 * alphabetical by code in practice)
 *
 * subject records are static in practice (they only change when NEU
 * adds or removes a campus location) and should be aggressively cached
 * at the call site
 */
export const getSubjects = cache(async (): Promise<Subject[]> => {
  return db
    .select({
      id: subjectsT.id,
      code: subjectsT.code,
      name: subjectsT.name,
    })
    .from(subjectsT);
});

/**
 * returns a single subject by its code, or `undefined` if no subject with that
 * code exists.
 *
 * @param code - The subject code to look up, e.g. `"CS"`.
 */
export const getSubjectByCode = cache(
  async (code: string): Promise<Subject | undefined> => {
    const result = await db
      .select({
        id: subjectsT.id,
        code: subjectsT.code,
        name: subjectsT.name,
      })
      .from(subjectsT)
      .where(eq(subjectsT.code, code));
    return result[0];
  },
);
