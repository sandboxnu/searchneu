import "server-only";
import { db } from "@/db";
import { sectionsT } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getClassTypes(term: string) {
  const classTypes = await db
    .selectDistinct({ classType: sectionsT.classType })
    .from(sectionsT)
    .where(eq(sectionsT.term, term));

  return classTypes.map((c) => c.classType);
}
