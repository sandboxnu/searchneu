import { useMemo } from "react";
import MiniSearch from "minisearch";
import useSWR from "swr";
import type { CourseSearchResult } from "./types";

interface CatalogSearchFilters {
  query: string;
  subjects: string[];
  minCourseLevel: number;
  maxCourseLevel: number;
  nupaths: string[];
  campuses: string[];
  classTypes: string[];
  honors: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * client-side catalog search powered by MiniSearch.
 *
 * fetches all courses for a term once, builds an in-memory search index,
 * then performs text search and filtering entirely on the client for speed.
 */
export function useCatalogSearch(term: string, filters: CatalogSearchFilters) {
  const { data: courses, isLoading } = useSWR<CourseSearchResult[]>(
    term ? `/api/catalog/courses/all?term=${term}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Build the MiniSearch index once when courses data changes
  const miniSearch = useMemo(() => {
    if (!courses || courses.length === 0) return null;

    const ms = new MiniSearch<CourseSearchResult>({
      fields: ["name", "register", "courseNumber"],
      storeFields: [
        "id",
        "name",
        "courseNumber",
        "subjectCode",
        "maxCredits",
        "minCredits",
        "nupaths",
        "nupathNames",
        "prereqs",
        "coreqs",
        "postreqs",
        "totalSections",
        "sectionsWithSeats",
        "campus",
        "classType",
        "honors",
      ],
      searchOptions: {
        boost: { register: 1.5, name: 1 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: "AND",
      },
      // Synthesize the `register` field for indexing (e.g. "CS 3500")
      extractField: (doc, fieldName) => {
        if (fieldName === "register") {
          return `${doc.subjectCode} ${doc.courseNumber}`;
        }
        return doc[fieldName as keyof CourseSearchResult] as string;
      },
    });

    ms.addAll(courses);
    return ms;
  }, [courses]);

  // Perform search and filtering
  const results = useMemo((): CourseSearchResult[] => {
    if (!courses || courses.length === 0) return [];

    const {
      query,
      subjects,
      minCourseLevel,
      maxCourseLevel,
      nupaths,
      campuses,
      classTypes,
      honors,
    } = filters;

    let matched: CourseSearchResult[];

    if (query && miniSearch) {
      // Text search using MiniSearch
      const searchResults = miniSearch.search(query);
      matched = searchResults.map((r) => ({
        id: r.id as number,
        name: r.name as string,
        courseNumber: r.courseNumber as string,
        subjectCode: r.subjectCode as string,
        maxCredits: r.maxCredits as string,
        minCredits: r.minCredits as string,
        nupaths: r.nupaths as string[],
        nupathNames: r.nupathNames as string[],
        prereqs: r.prereqs,
        coreqs: r.coreqs,
        postreqs: r.postreqs,
        totalSections: r.totalSections as number,
        sectionsWithSeats: r.sectionsWithSeats as number,
        campus: r.campus as string[],
        classType: r.classType as string[],
        honors: r.honors as boolean,
        score: r.score,
      }));
    } else {
      // No text query — return all courses sorted by name
      matched = courses.map((c) => ({ ...c, score: 0 }));
    }

    // Apply filters
    return matched.filter((r) => {
      const level = Math.floor(Number(r.courseNumber) / 1000);

      return (
        (subjects.length === 0 || subjects.includes(r.subjectCode)) &&
        (minCourseLevel === -1 || level >= minCourseLevel) &&
        (maxCourseLevel === -1 || level <= maxCourseLevel) &&
        (nupaths.length === 0 || nupaths.every((n) => r.nupaths.includes(n))) &&
        (campuses.length === 0 || r.campus.some((c) => campuses.includes(c))) &&
        (classTypes.length === 0 ||
          r.classType.some((t) => classTypes.includes(t))) &&
        (!honors || r.honors)
      );
    });
  }, [courses, miniSearch, filters]);

  return { results, isLoading };
}
