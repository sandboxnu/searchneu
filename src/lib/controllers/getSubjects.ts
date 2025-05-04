import "server-only";
import { db } from "@/db";
import { subjectsT } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSubjects(term: string) {
  const subjects = await db
    .select({
      value: subjectsT.code,
      label: subjectsT.name,
    })
    .from(subjectsT)
    .where(eq(subjectsT.term, term));

  return subjects;
}
