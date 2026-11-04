/**
 * Binary Meeting Time data structure for O(1) conflict checking.
 * Represents meeting times as binary masks for efficient bitwise operations.
 */

import { SectionWithCourse } from "./filters";

const MINUTES_PER_SLOT = 5;
const SLOTS_PER_DAY = (24 * 60) / MINUTES_PER_SLOT;

/**
 * Convert time in HHMM format to slot index using 5-minute granularity.
 */
function timeToSlotIndex(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const totalMinutes = hours * 60 + minutes;
  return Math.floor(totalMinutes / MINUTES_PER_SLOT);
}

/**
 * Convert a section's meeting times to a binary mask.
 *
 * A meeting occupies a contiguous run, so `(1 << slotCount) - 1` builds the
 * run in one expression and shifts it into place.
 */
export function meetingTimesToBinaryMask(section: SectionWithCourse): bigint {
  let mask = BigInt(0); // Use BigInt constructor to avoid ES2020 literal
  for (const meetingTime of section.meetingTimes) {
    const startSlot = timeToSlotIndex(meetingTime.startTime);
    const slotCount = timeToSlotIndex(meetingTime.endTime) - startSlot;

    // Ends before it starts, or within one slot: occupies nothing.
    if (slotCount <= 0) continue;

    const occupied = (BigInt(1) << BigInt(slotCount)) - BigInt(1);
    for (const day of meetingTime.days) {
      mask |= occupied << BigInt(day * SLOTS_PER_DAY + startSlot);
    }
  }
  return mask;
}

/**
 * Check if any sections in a schedule have conflicts.
 * Returns true if there are any conflicts, false otherwise.
 * Used for testing.
 */
export function hasConflictInSchedule(sections: SectionWithCourse[]): boolean {
  const masks = sections.map(meetingTimesToBinaryMask);
  for (let i = 0; i < masks.length; i++) {
    for (let j = i + 1; j < masks.length; j++) {
      if (masksConflict(masks[i], masks[j])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two binary masks conflict - O(1) operation.
 */
export function masksConflict(mask1: bigint, mask2: bigint): boolean {
  return (mask1 & mask2) !== BigInt(0);
}
