import { Audit, AuditTerm, AuditYear, SeasonEnum } from "./types";

// ── Shared Constants ────────────────────────────────────────────────────────

export const SEASON_DISPLAY: Record<string, string> = {
  [SeasonEnum.FL]: "Fall",
  [SeasonEnum.SP]: "Spring",
  [SeasonEnum.S1]: "Summer I",
  [SeasonEnum.S2]: "Summer II",
};

export const UNDECIDED_CONCENTRATION = "Concentration Undecided";

// ── Shared Helpers ──────────────────────────────────────────────────────────

export function courseToString(c: {
  subject: string;
  classId: string | number;
}): string {
  return `${c.subject}${c.classId}`;
}

/** Returns the term from a year for the given season. */
export function getTermFromYear<T>(
  year: AuditYear<T>,
  season: SeasonEnum,
): AuditTerm<T> | undefined {
  switch (season) {
    case SeasonEnum.FL:
      return year.fall;
    case SeasonEnum.SP:
      return year.spring;
    case SeasonEnum.S1:
      return year.summer1;
    case SeasonEnum.S2:
      return year.summer2;
    default:
      return undefined;
  }
}

/** Returns all four terms of a year as an array. */
export function allTerms<T>(year: AuditYear<T>): AuditTerm<T>[] {
  return [year.fall, year.spring, year.summer1, year.summer2];
}

/** Sum of minimum credits across all terms in an audit. */
export function creditsInAudit<T>(audit: Audit<T>): number {
  let sum = 0;
  for (const year of audit.years) {
    for (const term of allTerms(year)) {
      for (const course of term.classes) {
        sum += course.numCreditsMin;
      }
    }
  }
  return sum;
}
