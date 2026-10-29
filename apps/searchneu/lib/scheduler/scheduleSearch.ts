import { SectionWithCourse } from "./filters";
import { masksConflict } from "./binaryMeetingTime";

/**
 * Sections plus the time they occupy. Carrying the mask is what lets the same
 * search run over the sections of one course and over whole coreq groups.
 */
export type MaskedSelection = {
  sections: SectionWithCourse[];
  mask: bigint;
};

export const EMPTY_SELECTION: MaskedSelection = {
  sections: [],
  mask: BigInt(0),
};

const merge = (a: MaskedSelection, b: MaskedSelection): MaskedSelection => ({
  sections: [...a.sections, ...b.sections],
  mask: a.mask | b.mask,
});

/**
 * Step an odometer of indexes, carrying left when a digit runs out. Returns
 * true on overflow.
 *
 * Digits right of `position` are left alone: they are always already zero,
 * because a position is only stepped after every position before it was
 * accepted, and a carry zeroes what it passes.
 */
export const advanceIndexes = (
  indexes: number[],
  sizes: number[],
  position: number,
): boolean => {
  indexes[position]++;

  while (position >= 0 && indexes[position] >= sizes[position]) {
    indexes[position] = 0;
    position--;
    if (position >= 0) {
      indexes[position]++;
    }
  }

  return position < 0;
};

/**
 * Take one option from every slot, in every way that produces no conflict.
 *
 * Every slot must contribute, which is what makes this right for both coreq
 * groups and locked courses. With no slots there is one way to choose
 * nothing, so callers can start from an empty schedule without a special case.
 */
export const combineSelections = (
  slots: MaskedSelection[][],
): MaskedSelection[] => {
  if (slots.length === 0) return [EMPTY_SELECTION];
  if (slots.some((options) => options.length === 0)) return [];
  if (slots.length === 1) return slots[0];

  // Fewest options first, so conflicts surface where skipping discards most.
  const ordered = [...slots].sort((a, b) => a.length - b.length);

  const results: MaskedSelection[] = [];
  const sizes = ordered.map((options) => options.length);
  const indexes = new Array<number>(ordered.length).fill(0);

  for (;;) {
    let combined = EMPTY_SELECTION.mask;
    let conflictAt = -1;

    for (let slot = 0; slot < indexes.length; slot++) {
      const option = ordered[slot][indexes[slot]];
      if (masksConflict(combined, option.mask)) {
        conflictAt = slot;
        break;
      }
      combined |= option.mask;
    }

    if (conflictAt === -1) {
      results.push({
        sections: ordered.flatMap(
          (options, slot) => options[indexes[slot]].sections,
        ),
        mask: combined,
      });
      if (advanceIndexes(indexes, sizes, indexes.length - 1)) break;
    } else {
      // Everything further right is dead for this prefix.
      if (advanceIndexes(indexes, sizes, conflictAt)) break;
    }
  }

  return results;
};

/**
 * Extend a selection by taking some of the optional slots. Each is taken
 * whole or not at all, so a coreq group can never end up half-scheduled.
 */
export const extendWithOptional = (
  base: MaskedSelection,
  slots: MaskedSelection[][],
  targetCount?: number,
): MaskedSelection[] => {
  const results: MaskedSelection[] = [];

  if (targetCount !== undefined && targetCount < 0) return results;

  const search = (
    current: MaskedSelection,
    slot: number,
    taken: number,
  ): void => {
    if (slot === slots.length) {
      if (targetCount === undefined || taken === targetCount) {
        results.push(current);
      }
      return;
    }

    if (targetCount !== undefined) {
      if (taken + (slots.length - slot) < targetCount) return;
      if (taken === targetCount) {
        results.push(current);
        return;
      }
    }

    search(current, slot + 1, taken);

    for (const option of slots[slot]) {
      if (!masksConflict(current.mask, option.mask)) {
        search(merge(current, option), slot + 1, taken + 1);
      }
    }
  };

  search(base, 0, 0);
  return results;
};
