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

/**
 * Step an odometer of indexes, carrying left when a digit runs out. Returns
 * the position stepped, or -1 on overflow.
 *
 * Digits right of `position` are left alone: they are always already zero,
 * because a position is only stepped after every position before it was
 * accepted, and a carry zeroes what it passes.
 */
export const advanceFrom = (
  indexes: number[],
  sizes: number[],
  position: number,
): number => {
  while (position >= 0) {
    indexes[position]++;
    if (indexes[position] < sizes[position]) return position;
    indexes[position] = 0;
    position--;
  }

  return -1;
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
  const slotCount = ordered.length;
  const sizes = ordered.map((options) => options.length);
  const indexes = new Array<number>(slotCount).fill(0);

  // prefixMasks[i] is the time taken by positions 0..i-1, so a position is
  // tested against one number and the prefix survives when only a later
  // position moves.
  const prefixMasks = new Array<bigint>(slotCount + 1).fill(BigInt(0));

  let position = 0;

  for (;;) {
    if (position === slotCount) {
      results.push({
        sections: ordered.flatMap(
          (options, slot) => options[indexes[slot]].sections,
        ),
        mask: prefixMasks[slotCount],
      });

      position = advanceFrom(indexes, sizes, slotCount - 1);
      if (position < 0) break;
      continue;
    }

    const option = ordered[position][indexes[position]];

    if (masksConflict(prefixMasks[position], option.mask)) {
      // Everything further right is dead for this prefix.
      position = advanceFrom(indexes, sizes, position);
      if (position < 0) break;
    } else {
      prefixMasks[position + 1] = prefixMasks[position] | option.mask;
      position++;
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

  // Unwound as the search backs out; copied only when a result is recorded.
  const chosen: SectionWithCourse[] = [...base.sections];

  const record = (mask: bigint) => {
    results.push({ sections: [...chosen], mask });
  };

  const search = (mask: bigint, slot: number, taken: number): void => {
    if (slot === slots.length) {
      if (targetCount === undefined || taken === targetCount) record(mask);
      return;
    }

    if (targetCount !== undefined) {
      if (taken + (slots.length - slot) < targetCount) return;
      if (taken === targetCount) {
        record(mask);
        return;
      }
    }

    search(mask, slot + 1, taken);

    for (const option of slots[slot]) {
      if (masksConflict(mask, option.mask)) continue;

      chosen.push(...option.sections);
      search(mask | option.mask, slot + 1, taken + 1);
      // An option can carry several sections, so unwind by its length.
      chosen.length -= option.sections.length;
    }
  };

  search(base.mask, 0, 0);
  return results;
};
