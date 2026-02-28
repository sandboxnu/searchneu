import "server-only";
import { db, trackersT } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { cache } from "react";

/**
 * returns the IDs of all sections that a user is actively tracking (i.e. their
 * tracker record has not been soft-deleted)
 *
 * only non-deleted trackers are included (`deletedAt IS NULL`). a user may have
 * previously tracked and stopped tracking a section - those records are excluded
 *
 * @param userId - authenticated user's ID from the session
 * @returns  array of section IDs the user is currently tracking (empty
 *                 if the user has no active trackers)
 */
export const getTrackedSectionIds = cache(
  async (userId: string): Promise<number[]> => {
    const trackers = await db
      .select({ sectionId: trackersT.sectionId })
      .from(trackersT)
      .where(and(eq(trackersT.userId, userId), isNull(trackersT.deletedAt)));

    return trackers.map((t) => t.sectionId);
  },
);
