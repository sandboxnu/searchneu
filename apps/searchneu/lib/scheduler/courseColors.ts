import { type SectionWithCourse } from "./filters";

export interface CourseColor {
  fill: string;
  stroke: string;
  accent: string;
}

// Course color palette matching Figma designs
export const COURSE_COLORS: CourseColor[] = [
  {
    fill: "#fffaf9",
    stroke: "#ffe4e0",
    accent: "#f08890",
  },
  {
    fill: "#fff9f4",
    stroke: "#fff1e4",
    accent: "#ffb067",
  },
  {
    fill: "#f1fbfd",
    stroke: "#dbf4fb",
    accent: "#98e1f5",
  },
  {
    fill: "#fffdef",
    stroke: "#fff9d8",
    accent: "#fae98f",
  },
  {
    fill: "#f4fcf7",
    stroke: "#dbf6e5",
    accent: "#89ecae",
  },
  {
    fill: "#f6f6fd",
    stroke: "#e2e0f8",
    accent: "#c8c3fe",
  },
];

// Creates a consistent course key from a section
export function getCourseKey(section: SectionWithCourse): string {
  return `${section.courseSubject} ${section.courseNumber}`;
}

// Builds a map of course keys to colors based on filtered schedules.
// Colors are assigned alphabetically by course key and cycle through the palette.
export function getCourseColorMap(
  filteredSchedules: SectionWithCourse[][],
): Map<string, CourseColor> {
  // Collect all unique course keys across all schedules
  const courseKeySet = new Set<string>();

  for (const schedule of filteredSchedules) {
    for (const section of schedule) {
      courseKeySet.add(getCourseKey(section));
    }
  }

  // Sort course keys alphabetically for consistent color assignment
  const sortedCourseKeys = Array.from(courseKeySet).sort();

  // Assign colors by index, cycling through the palette
  const colorMap = new Map<string, CourseColor>();
  sortedCourseKeys.forEach((courseKey, index) => {
    colorMap.set(courseKey, COURSE_COLORS[index % COURSE_COLORS.length]);
  });

  return colorMap;
}

// Gets the color for a specific section based on its course
export function getSectionColor(
  section: SectionWithCourse,
  colorMap: Map<string, CourseColor>,
): CourseColor | undefined {
  return colorMap.get(getCourseKey(section));
}
