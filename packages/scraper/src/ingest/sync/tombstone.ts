/**
 * Decides which catalog rows Banner has stopped listing.
 *
 * Nothing here deletes. A missing row is marked with when it went missing,
 * and tombstoned once it has stayed missing for long enough; a row that
 * comes back is cleared. A marked row is left alone in between, so it costs
 * no write per pass. Reaping is manual.
 *
 * Absence is judged against the sweep alone, so it never waits on a course
 * scrape.
 */

export interface TombstonePolicy {
  /** how long a row must have been missing for */
  afterMs: number;
}

export interface TombstoneCandidate {
  id: number;
  /** CRN for a section, register for a course */
  key: string;
  missingSince: Date | null;
  tombstonedAt: Date | null;
}

/** The columns a row ends the pass with. */
export interface TombstoneChange {
  id: number;
  key: string;
  action: "mark" | "tombstone" | "restore";
  missingSince: Date | null;
  tombstonedAt: Date | null;
}

export function planTombstones(
  candidates: readonly TombstoneCandidate[],
  presentKeys: ReadonlySet<string>,
  policy: TombstonePolicy,
  now: Date,
): TombstoneChange[] {
  const changes: TombstoneChange[] = [];

  for (const row of candidates) {
    if (presentKeys.has(row.key)) {
      if (!row.missingSince && !row.tombstonedAt) continue;

      changes.push({
        id: row.id,
        key: row.key,
        action: "restore",
        missingSince: null,
        tombstonedAt: null,
      });
      continue;
    }

    // already tombstoned: terminal until it returns or is reaped
    if (row.tombstonedAt) continue;

    if (!row.missingSince) {
      changes.push({
        id: row.id,
        key: row.key,
        action: "mark",
        missingSince: now,
        tombstonedAt: null,
      });
      continue;
    }

    if (now.getTime() - row.missingSince.getTime() >= policy.afterMs) {
      changes.push({
        id: row.id,
        key: row.key,
        action: "tombstone",
        missingSince: row.missingSince,
        tombstonedAt: now,
      });
    }
  }

  return changes;
}
