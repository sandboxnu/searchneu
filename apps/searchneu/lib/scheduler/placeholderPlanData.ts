import type { AppliedFilterItem, PlanCourse } from "./types";

/**
 * Filler data for plan cards until saved plans are loaded from the DB.
 * Replace with plan.filters / plan.courses from your API (e.g. getSavedPlans) when syncing.
 */

export const PLACEHOLDER_PLAN_FILTERS: AppliedFilterItem[] = [
  { label: "Campus", value: "Boston" },
  { label: "Start and end time", value: "9:00 AM – 5:00 PM" },
  { label: "Free days", value: "Friday" },
  { label: "NUpaths", value: "EI, SI" },
  { label: "Honors", value: "Yes" },
  { label: "Filled sections", value: "Exclude" },
];

export const PLACEHOLDER_PLAN_COURSES: PlanCourse[] = [
  { code: "CS3000", name: "Algorithms and Data", category: "algorithms" },
  { code: "CS3500", name: "Object-Oriented Design", category: "ood" },
  { code: "CS3800", name: "Theory of Computation", category: "theory" },
  { code: "CS4500", name: "Software Development", category: "software" },
  { code: "CS5200", name: "Database Management", category: "database" },
  { code: "DS3000", name: "Foundations of Data Science", category: "data-science" },
  { code: "CS2510", name: "Fundamentals of Computer Science 2", category: "fundamentals" },
];
