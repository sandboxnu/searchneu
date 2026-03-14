import { Audit } from "./types";

export function creditsInAudit<T>(audit: Audit<T>): number {
  let sum = 0;

  for (const year of audit.years) {
    for (const course of year.fall.classes) {
      // do we add min or max lol??
      sum += course.numCreditsMin;
    }
    for (const course of year.spring.classes) {
      // do we add min or max lol??
      sum += course.numCreditsMin;
    }
    for (const course of year.summer1.classes) {
      // do we add min or max lol??
      sum += course.numCreditsMin;
    }
    for (const course of year.summer2.classes) {
      // do we add min or max lol??
      sum += course.numCreditsMin;
    }
  }

  return sum;
}
