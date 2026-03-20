import { type SectionWithCourse } from "./filters";
import { type Section } from "@/lib/catalog/types";

export function getScheduleKey(
  schedule: SectionWithCourse[] | Section[],
): string {
  return schedule
    .map((section) => section.id)
    .sort((a, b) => a - b)
    .join("|");
}
