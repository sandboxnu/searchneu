import { Course, Section, Term } from "@/lib/catalog/types";
import {
  CourseIdentifier,
  CourseReq,
  ModalCourse,
  SelectedCourseGroupData,
} from "./types";

/**
 * Shallow equality check for two course identifiers.
 * @param c1 the first course identifier
 * @param c2 the second course identifier
 * @returns true if the courses are equal, false otherwise
 */
export const isCourseMatch = (c1: CourseIdentifier, c2: CourseIdentifier) =>
  c1.subjectCode === c2.subjectCode && c1.courseNumber === c2.courseNumber;

/**
 * Checks if a course is already selected in the given groups.
 * @param groups the currently selected course groups
 * @param course the course to check
 * @returns true if the course is already selected, false otherwise
 */
export const isAlreadySelected = (
  groups: SelectedCourseGroupData[],
  course: CourseIdentifier,
) =>
  groups.some(
    (g) =>
      isCourseMatch(g.parent, course) ||
      g.coreqs.some((c) => isCourseMatch(c, course)),
  );

// Coreq Helpers
/**
 * Given a corequisite object, extract this coreq's corequisite courses recursively.
 * @param req corquisite object
 * @param acc accumulator of corequisite courses
 * @returns a flattened array of corequisite courses
 */
export const extractCoreqReqs = (
  req: CourseReq | null | undefined,
  acc: CourseIdentifier[] = [],
): CourseIdentifier[] => {
  if (!req || typeof req !== "object") return acc;

  if (req.subject && req.courseNumber) {
    acc.push({ subjectCode: req.subject, courseNumber: req.courseNumber });
  } else if (req.items && Array.isArray(req.items)) {
    req.items.forEach((item) => extractCoreqReqs(item, acc));
  }
  return acc;
};

/**
 * Sorts the groups by their parent course number, with corequisites sorted within each group (ascending by course number).
 * @param groups array of grouped course data
 * @returns sorted array of grouped course data
 */
export const sortGroups = (
  groups: SelectedCourseGroupData[],
): SelectedCourseGroupData[] =>
  [...groups].map((group) => {
    const allInGroup = [group.parent, ...group.coreqs].sort((a, b) =>
      a.courseNumber.localeCompare(b.courseNumber, undefined, {
        numeric: true,
      }),
    );
    return { parent: allInGroup[0], coreqs: allInGroup.slice(1) };
  });

export const getSelectionText = (groups: SelectedCourseGroupData[]): string => {
  const parents = groups.length;
  if (parents === 0) return "No courses added.";

  const coreqs = groups.reduce((acc, g) => acc + g.coreqs.length, 0);
  const possible = groups.reduce(
    (acc, g) => acc + extractCoreqReqs(g.parent.coreqs as CourseReq).length,
    0,
  );
  const absent = possible - coreqs;

  return `${parents} course${parents !== 1 ? "s" : ""} added${
    coreqs > 0 ? `, ${coreqs} corequisite${coreqs !== 1 ? "s" : ""} added` : ""
  }${absent > 0 ? `, ${absent} unadded corequisite${absent !== 1 ? "s" : ""}` : ""}.`;
};

/**
 * Fetches a course by its ID from the catalog API.
 * @param id course ID
 * @returns a Course object
 */
export async function fetchCourseById(id: number): Promise<Course | null> {
  const res = await fetch(`/api/catalog/courses/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`failed to fetch course ${id}: ${res.status}`);
  return (await res.json()) as Course;
}

/**
 * Fetches corequisite courses for a given course from the catalog API.
 * @param course the course to fetch corequisites for
 * @param currentGroups the currently selected course groups
 * @param term the term to fetch corequisites for
 * @returns an array of ModalCourse objects
 */
export async function fetchCoreqCourses(
  course: ModalCourse,
  currentGroups: SelectedCourseGroupData[],
  term: Term,
): Promise<ModalCourse[]> {
  const allReqs = extractCoreqReqs(course.coreqs as CourseReq);
  const neededReqs = allReqs.filter(
    (req) => !isAlreadySelected(currentGroups, req),
  );

  const results = await Promise.all(
    neededReqs.map(async (req) => {
      const params = new URLSearchParams({
        term: term.term + term.part,
        subject: req.subjectCode,
        courseNumber: req.courseNumber,
      });
      const res = await fetch(`/api/catalog/courses?${params.toString()}`);
      if (!res.ok) return null;
      return (await res.json()) as Course;
    }),
  );

  return results.filter((c): c is Course => c !== null);
}

/**
 * Fetches sections for a list of courses from the catalog API.
 * @param courseIds array of course IDs
 * @returns a map of course IDs to their corresponding sections
 */
export async function fetchSectionsForCourses(
  courseIds: number[],
): Promise<Map<number, Section[]>> {
  const sectionsByCourseId = new Map<number, Section[]>();

  const results = await Promise.all(
    courseIds.map(async (courseId) => {
      try {
        const res = await fetch(`/api/catalog/courses/${courseId}/sections`);
        if (res.ok) {
          return { courseId, sections: (await res.json()) as Section[] };
        }
      } catch (error) {
        console.error(
          `Failed to fetch sections for course ${courseId}:`,
          error,
        );
      }
      return { courseId, sections: [] as Section[] };
    }),
  );

  for (const { courseId, sections } of results) {
    sectionsByCourseId.set(courseId, sections);
  }

  return sectionsByCourseId;
}
