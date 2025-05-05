import "server-only";
import { db } from "@/db";
import { sectionsT } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCampuses(term: string) {
  const campuses = await db
    .selectDistinct({ campus: sectionsT.campus })
    .from(sectionsT)
    .where(eq(sectionsT.term, term));

  return campuses.map((c) => c.campus);
}
