import { type SectionWithCourse } from "./filters";

export interface CourseColor {
  fill: string;
  stroke: string;
  accent: string;
}

// Course color palette - hardcoded to match Figma design
export const COURSE_COLORS: CourseColor[] = [
  {
    fill: "rgba(255,228,224,0.2)",
    stroke: "var(--scheduler-course-red-stroke)",
    accent: "#f08890",
  },
  {
    fill: "rgba(255,241,228,0.4)",
    stroke: "var(--scheduler-course-orange-stroke)",
    accent: "#ffb067",
  },
  {
    fill: "rgba(219,244,251,0.4)",
    stroke: "var(--scheduler-course-blue-stroke)",
    accent: "#98e1f5",
  },
  {
    fill: "rgba(255,249,216,0.4)",
    stroke: "var(--scheduler-course-yellow-stroke)",
    accent: "#fae98f",
  },
  {
    fill: "rgba(219,246,229,0.3)",
    stroke: "var(--scheduler-course-green-stroke)",
    accent: "#89ecae",
  },
  {
    fill: "rgba(226,224,248,0.3)",
    stroke: "var(--scheduler-course-purple-stroke)",
    accent: "#c8c3fe",
  },
  {
    fill: "rgba(255,228,240,0.3)",
    stroke: "var(--scheduler-course-pink-stroke)",
    accent: "#f0a0c0",
  },
  {
    fill: "rgba(234,234,234,0.3)",
    stroke: "var(--scheduler-course-gray-stroke)",
    accent: "#b0b0b0",
  },
  {
    fill: "rgba(233,224,217,0.3)",
    stroke: "var(--scheduler-course-brown-stroke)",
    accent: "#c4a882",
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
