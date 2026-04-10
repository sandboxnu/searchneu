import { db, auditMetadataT } from "@/lib/db";
import { eq } from "drizzle-orm";
import { AuditCourse } from "@/lib/graduate/types";

export async function getAuditMetadata(userId: string) {
  return db.query.auditMetadataT.findFirst({
    where: eq(auditMetadataT.userId, userId),
  });
}

export async function updateTransferCourses(
  userId: string,
  transferCourses: AuditCourse[],
) {
  const existing = await getAuditMetadata(userId);

  if (existing) {
    const result = await db
      .update(auditMetadataT)
      .set({ coursesTransferred: transferCourses })
      .where(eq(auditMetadataT.userId, userId))
      .returning();
    return result[0] ?? null;
  }

  const result = await db
    .insert(auditMetadataT)
    .values({ userId, coursesTransferred: transferCourses })
    .returning();
  return result[0] ?? null;
}
