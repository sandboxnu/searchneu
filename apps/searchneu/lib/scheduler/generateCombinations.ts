import { SectionWithCourse } from "./filters";
import { meetingTimesToBinaryMask } from "./binaryMeetingTime";

// Cap to prevent runaway generation when courses have many non-conflicting sections
export const MAX_RESULTS = 100;

/**
 * Used to keep track of indexes of sections and increment them when they conflict w the current schedule
 * Returns true if overflow (we're done), false otherwise
 */
export const incrementIndex = (
  indexes: number[],
  sizes: number[],
  position: number,
): boolean => {
  indexes[position]++;

  // Handle carry/overflow like an odometer
  while (position >= 0 && indexes[position] >= sizes[position]) {
    indexes[position] = 0;
    position--;
    if (position >= 0) {
      indexes[position]++;
    }
  }

  // If position < 0, we've overflowed completely
  return position < 0;
};

/**
 * Increment indexes starting at `pos`, carrying left as needed.
 * Returns the position that was successfully incremented, or -1 if overflow.
 */
const incrementPosition = (
  indexes: number[],
  sizes: number[],
  pos: number,
): number => {
  while (pos >= 0) {
    indexes[pos]++;
    if (indexes[pos] < sizes[pos]) return pos;
    indexes[pos] = 0;
    pos--;
  }
  return -1;
};

/**
 * Optimized iterative generation with conflict-aware skipping.
 * Uses binary time representation for O(1) conflict checking.
 *
 * Key optimisation over the naive approach: maintains a running `prefixMask`
 * array so each new position is checked against a single OR-combined bigint
 * (O(1)) rather than looping over all previously-accepted masks (O(n)).
 * This also avoids rebuilding the combination from scratch each iteration —
 * when only the last index advances the prefix state for positions 0..n-2
 * is already valid and is reused directly.
 *
 * Returns both the schedule and its combined time-mask so callers can avoid
 * recomputing it when adding optional courses.
 */
export const generateCombinationsOptimized = (
  sectionsByCourse: SectionWithCourse[][],
  maxResults?: number,
): { schedule: SectionWithCourse[]; mask: bigint }[] => {
  if (sectionsByCourse.length === 0) return [];
  if (sectionsByCourse.length === 1) {
    const limit = maxResults ?? Infinity;
    return sectionsByCourse[0].slice(0, limit).map((section) => ({
      schedule: [section],
      mask: meetingTimesToBinaryMask(section),
    }));
  }

  // A course with no sections means no valid schedule can include it
  if (sectionsByCourse.some((s) => s.length === 0)) return [];

  // Sort courses by number of sections (fewest first) to hit conflicts early
  const sortedSections = sectionsByCourse
    .map((sections, idx) => ({ sections, idx, count: sections.length }))
    .sort((a, b) => a.count - b.count)
    .map((item) => item.sections);

  const result: { schedule: SectionWithCourse[]; mask: bigint }[] = [];
  const n = sortedSections.length;
  const sizes = sortedSections.map((s) => s.length);
  const indexes = new Array<number>(n).fill(0);

  // Pre-compute binary masks for all sections once
  const sectionMasks: bigint[][] = sortedSections.map((sections) =>
    sections.map(meetingTimesToBinaryMask),
  );

  // prefixMasks[i] = OR of masks for accepted sections at positions 0..i-1.
  // When we advance without carry, prefixMasks[0..pos-1] remain valid.
  const prefixMasks = new Array<bigint>(n + 1).fill(BigInt(0));

  let pos = 0;

  while (true) {
    if (pos === n) {
      // All positions accepted — record the valid schedule
      result.push({
        schedule: sortedSections.map((s, i) => s[indexes[i]]),
        mask: prefixMasks[n],
      });
      if (maxResults !== undefined && result.length >= maxResults) break;
      // Advance from the last position
      const newPos = incrementPosition(indexes, sizes, n - 1);
      if (newPos < 0) break;
      pos = newPos;
      continue;
    }

    const mask = sectionMasks[pos][indexes[pos]];
    if ((prefixMasks[pos] & mask) !== BigInt(0)) {
      // Conflict — skip to next section at this position (carry if needed)
      const newPos = incrementPosition(indexes, sizes, pos);
      if (newPos < 0) break;
      pos = newPos;
    } else {
      // No conflict — accept and move forward
      prefixMasks[pos + 1] = prefixMasks[pos] | mask;
      pos++;
    }
  }

  return result;
};

/**
 * Try adding optional courses to a base schedule.
 *
 * Optimisations:
 * - Optional section masks are pre-computed once by the caller and passed in.
 * - A single combined `bigint` mask is threaded through recursion instead of
 *   an array — conflict check is O(1) rather than O(n).
 * - The mutable `currentSchedule` array uses push/pop instead of spreading a
 *   new array on every recursive call.
 */
export const addOptionalCourses = (
  baseSchedule: SectionWithCourse[],
  baseMask: bigint,
  optionalSectionsByCourse: SectionWithCourse[][],
  optionalSectionMasks: bigint[][],
  numCourses?: number,
  maxResults?: number,
): SectionWithCourse[][] => {
  const results: SectionWithCourse[][] = [];
  // Mutated in-place; copied only when pushed to results
  const currentSchedule: SectionWithCourse[] = [...baseSchedule];

  const recurse = (combinedMask: bigint, courseIndex: number) => {
    if (maxResults !== undefined && results.length >= maxResults) return;

    if (courseIndex === optionalSectionsByCourse.length) {
      if (numCourses === undefined || currentSchedule.length === numCourses) {
        results.push([...currentSchedule]);
      }
      return;
    }

    if (numCourses !== undefined) {
      const remainingSlots = optionalSectionsByCourse.length - courseIndex;
      if (currentSchedule.length + remainingSlots < numCourses) return;

      if (currentSchedule.length === numCourses) {
        recurse(combinedMask, optionalSectionsByCourse.length);
        return;
      }
    }

    // Choice A: Skip this optional course
    recurse(combinedMask, courseIndex + 1);

    if (maxResults !== undefined && results.length >= maxResults) return;

    // Choice B: Try each section of this optional course
    const sections = optionalSectionsByCourse[courseIndex];
    const masks = optionalSectionMasks[courseIndex];
    for (let i = 0; i < sections.length; i++) {
      const sectionMask = masks[i];
      if ((combinedMask & sectionMask) === BigInt(0)) {
        currentSchedule.push(sections[i]);
        recurse(combinedMask | sectionMask, courseIndex + 1);
        currentSchedule.pop();
        if (maxResults !== undefined && results.length >= maxResults) return;
      }
    }
  };

  recurse(baseMask, 0);
  return results;
};
