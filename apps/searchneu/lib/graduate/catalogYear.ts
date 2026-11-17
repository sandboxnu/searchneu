// The academic year rolls over in July (month index 6), so fall semester
// counts as the start of a new academic year.
const ACADEMIC_YEAR_START_MONTH = 6;

// How many catalog years back a current student could still be on. Four years
// back covers fifth-year students (e.g. Fall 2026 -> 2022 catalog).
const SUPPORTED_CATALOG_YEARS_BACK = 4;

/**
 * Returns the oldest catalog year Graduate should offer, based on the current
 * date. Older catalogs remain in the database but are hidden from students.
 */
export function minSupportedCatalogYear(now: Date = new Date()): number {
  const academicYear =
    now.getMonth() >= ACADEMIC_YEAR_START_MONTH
      ? now.getFullYear()
      : now.getFullYear() - 1;
  return academicYear - SUPPORTED_CATALOG_YEARS_BACK;
}
