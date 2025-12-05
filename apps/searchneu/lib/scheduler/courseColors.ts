import { type SectionWithCourse } from "./filters";

export interface CourseColor {
  fill: string;
  stroke: string;
}

// Course color palette - same as defined in globals.css
export const COURSE_COLORS: CourseColor[] = [
  { fill: "var(--scheduler-course-yellow-fill)", stroke: "var(--scheduler-course-yellow-stroke)" },
  { fill: "var(--scheduler-course-red-fill)", stroke: "var(--scheduler-course-red-stroke)" },
  { fill: "var(--scheduler-course-blue-fill)", stroke: "var(--scheduler-course-blue-stroke)" },
  { fill: "var(--scheduler-course-purple-fill)", stroke: "var(--scheduler-course-purple-stroke)" },
  { fill: "var(--scheduler-course-green-fill)", stroke: "var(--scheduler-course-green-stroke)" },
  { fill: "var(--scheduler-course-orange-fill)", stroke: "var(--scheduler-course-orange-stroke)" },
  { fill: "var(--scheduler-course-pink-fill)", stroke: "var(--scheduler-course-pink-stroke)" },
  { fill: "var(--scheduler-course-gray-fill)", stroke: "var(--scheduler-course-gray-stroke)" },
  { fill: "var(--scheduler-course-brown-fill)", stroke: "var(--scheduler-course-brown-stroke)" },
];

// Creates a consistent course key from a section
export function getCourseKey(section: SectionWithCourse): string {
  return `${section.courseSubject} ${section.courseNumber}`;
}


// Builds a map of course keys to colors based on filtered schedules.
// Colors are assigned alphabetically by course key and cycle through the palette.
export function getCourseColorMap(filteredSchedules: SectionWithCourse[][]): Map<string, CourseColor> {
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
