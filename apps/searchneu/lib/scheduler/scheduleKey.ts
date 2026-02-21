import { type SectionWithCourse } from "./filters";

export function getScheduleKey(schedule: SectionWithCourse[]): string {
  return schedule
    .map((section) => section.crn)
    .sort()
    .join("|");
}
