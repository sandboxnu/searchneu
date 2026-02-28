/**
 * Application-level shared types.
 *
 * Catalog entity types (Term, GroupedTerms, Course, Section, etc.) live in
 * `@/lib/catalog/types` and are re-exported here for backward compatibility
 * with existing imports.
 */

export type { Term, GroupedTerms } from "@/lib/catalog/types";

/**
 * A subject formatted as a select-option pair for use in dropdown UI components.
 * This is a UI-only type — for the full subject entity with `id`, `code`, and
 * `name`, see `Subject` in `@/lib/catalog/types`.
 */
export interface Subject {
  label: string;
  value: string;
}
