"use client"
import { useState, useEffect } from "react";

export function useSearchCourse(term:string,subject:string, courseNumber:number) {
  // pulled from resultcard.tsx
  const [data, setData] = useState<{
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: string;
    maxCredits: string;
    sectionsWithSeats: number;
    totalSections: number;
    nupaths: string[];
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await (await fetch(`/api/search?term=${term}&subj=${subject}&q=${courseNumber}`))
        const json = await res.json()
        setData(json[0]);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch majors"),
        );
      }
    };

    fetchMajors();
  }, [term,subject,courseNumber]);

  return { data, error };
}