import { Course, Section } from "@/scraper/types";

type Meeting = Section["meetingTimes"][number];

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  // Overlap if intervals intersect with positive length
  return aStart < bEnd && bStart < aEnd;
}

function sectionsConflict(a: Section, b: Section): boolean {
  const aMeetings: Meeting[] = a.meetingTimes.filter((m) => !m.final);
  const bMeetings: Meeting[] = b.meetingTimes.filter((m) => !m.final);

  if (aMeetings.length === 0 || bMeetings.length === 0) return false;

  // Compare per-day intervals
  for (const am of aMeetings) {
    for (const bm of bMeetings) {
      // Fast check: only consider days that overlap
      const sharedDays = am.days.some((d) => bm.days.includes(d));
      if (!sharedDays) continue;

      if (intervalsOverlap(am.startTime, am.endTime, bm.startTime, bm.endTime)) {
        return true;
      }
    }
  }
  return false;
}

function isCompatible(selection: (Section | null)[], candidate: Section): boolean {
  for (const chosen of selection) {
    if (!chosen) continue;
    if (sectionsConflict(chosen, candidate)) return false;
  }
  return true;
}

export async function generateSchedules(courses: Course[]): Promise<Section[][]> {
  if (!courses || courses.length === 0) return [];

  // If any course has no sections, there are no complete schedules
  for (const c of courses) {
    if (!c.sections || c.sections.length === 0) return [];
  }

  // Sort courses by branching factor (fewest sections first) for better pruning
  const indexedCourses = courses.map((c, i) => ({ course: c, originalIndex: i }));
  indexedCourses.sort((a, b) => a.course.sections.length - b.course.sections.length);

  const selection: (Section | null)[] = new Array(courses.length).fill(null);
  const results: Section[][] = [];

  function backtrack(idx: number) {
    if (idx === indexedCourses.length) {
      // All courses chosen
      results.push(selection as Section[]);
      return;
    }

    const { course, originalIndex } = indexedCourses[idx];
    for (const section of course.sections) {
      if (!isCompatible(selection, section)) continue;
      selection[originalIndex] = section;
      backtrack(idx + 1);
      selection[originalIndex] = null;
    }
  }

  backtrack(0);
  return results;
}