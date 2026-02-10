/** Single filter chip shown on a plan card. Use when syncing with saved plans from the DB. */
export interface AppliedFilterItem {
  label: string;
  value: string;
}

/** Course included in a plan. Use when syncing with saved plans from the DB. */
export interface PlanCourse {
  code: string;
  name: string;
  /** Category/field for the left-bar color (e.g. "algorithms", "ood"). When syncing, set from DB. */
  category?: string;
}

/** Plan as shown on the dashboard. Extend with DB fields (e.g. userId, termId) when syncing. */
export interface Plan {
  id: string;
  name: string;
  /** Applied filters for this plan. When loading from DB, populate from saved plan. */
  filters?: AppliedFilterItem[];
  /** Courses in this plan. When loading from DB, populate from saved plan. */
  courses?: PlanCourse[];
}
