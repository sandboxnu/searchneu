import { type SectionWithCourse } from "./filters";

export interface CourseColor {
  fill: string;
  stroke: string;
  accent: string;
}

// Course color palette - matches Figma design
// Each color has: accent (100%), stroke (30%), fill (15%)
export const COURSE_COLORS: CourseColor[] = [
  {
    fill: "#FFECF3",
    stroke: "#FFD9E7",
    accent: "#FFC1DC",
  },
  {
    fill: "#FDECED",
    stroke: "#F9C8CB",
    accent: "#F08890",
  },
  {
    fill: "#FFF2E4",
    stroke: "#FFE1C1",
    accent: "#FFC577",
  },
  {
    fill: "#FEFBE8",
    stroke: "#FDF5C5",
    accent: "#FAE98F",
  },
  {
    fill: "#E6FBF0",
    stroke: "#C9F6DD",
    accent: "#72E69D",
  },
  {
    fill: "#E9F9FE",
    stroke: "#D0F2FD",
    accent: "#8FE4FB",
  },
  {
    fill: "#EEEDFE",
    stroke: "#DDDAFF",
    accent: "#C8C3FE",
  },
  {
    fill: "#F5F5F5",
    stroke: "#E8E8E8",
    accent: "#D9D9D9",
  },
  {
    fill: "#F2EEEA",
    stroke: "#E0D7CE",
    accent: "#C3AC98",
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
