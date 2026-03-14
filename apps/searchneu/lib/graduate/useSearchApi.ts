"use client";
import { useState, useEffect } from "react";

export function useSearchCourse(
  term: string,
  subject: string,
  courseNumber: number,
) {
  // pulled from resultcard.tsx
  const [data, setData] = useState<{
    name: string;
    courseNumber: string;
    subject: string;
    numCreditsMin: string;
    numCreditsMax: string;
    sectionsWithSeats: number;
    totalSections: number;
    nupaths: string[];
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(
          `/api/catalog/courses?term=${term}&subject=${subject}&courseNumber=${courseNumber}`,
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error(
                `Failed to fetch course, ${subject + courseNumber} in term ${term}`,
              ),
        );
      }
    };

    fetchCourse();
  }, [term, subject, courseNumber]);

  return { data, error };
}
