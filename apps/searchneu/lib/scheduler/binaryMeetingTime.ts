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
 * Get global slot index (0-2015) for a given day and slot within that day.
 */
function getGlobalSlotIndex(day: number, slot: number): number {
  return day * SLOTS_PER_DAY + slot;
}

/**
 * Convert a section's meeting times to a binary mask.
 * Each occupied 5-minute slot gets one bit set.
 */
export function meetingTimesToBinaryMask(section: SectionWithCourse): bigint {
  let mask = BigInt(0); // Use BigInt constructor to avoid ES2020 literal
  for (const meetingTime of section.meetingTimes) {
    const startSlot = timeToSlotIndex(meetingTime.startTime);
    const endSlotExclusive = timeToSlotIndex(meetingTime.endTime);

    // Set bits for each occupied slot
    for (const day of meetingTime.days) {
      for (let slot = startSlot; slot < endSlotExclusive; slot++) {
        const globalSlot = getGlobalSlotIndex(day, slot);
        mask |= BigInt(1) << BigInt(globalSlot);
      }
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
