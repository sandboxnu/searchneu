/**
 * List of informal/colloquial course names from course titles, a.k.a. "fundies" has no easy,
 * mappable, easy relationship to "Fundamentals of Computer Science 1".
 *
 * Each entry maps one course's register (CS 2500) to every nickname used. Add new entries as you
 * discover shorthands for course names. Extensible list for short-scope of courses.
 */

export interface CourseNickname {
  register: string;
  aliases: string[];
}

export const COURSE_NICKNAMES = [
  { register: "CS 2500", aliases: ["fundies", "fundies 1"] },
  { register: "CS 2510", aliases: ["fundies", "fundies 2"] },
  { register: "CS 4530", aliases: ["swe"] },
  { register: "MATH 1341", aliases: ["calc1"] },
  { register: "MATH 1342", aliases: ["calc2"] },
  { register: "MATH 2321", aliases: ["calc3"] },
  { register: "MATH 3081", aliases: ["prob and stats"] },
  { register: "PHYS 3602", aliases: ["e&m"] },
] as const satisfies ReadonlyArray<CourseNickname>;

const NICKNAMES_BY_REGISTER: Record<string, readonly string[]> =
  Object.fromEntries(
    COURSE_NICKNAMES.map(({ register, aliases }) => [register, aliases]),
  );

export function getNicknames(register: string): string {
  return (NICKNAMES_BY_REGISTER[register] ?? []).join(" ");
}
