"use client"
import { Course } from "@sneu/scraper/types";
import { useState, useEffect } from "react";

// DENNIS HELP : do we have a shared type????
interface CourseInfo {
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: string;
    maxCredits: string;
    sectionsWithSeats: number;
    totalSections: number;
    nupaths: string[];
};

const cache = new Map<string, CourseInfo>();

export function useSearchCourse(term:string,subject:string, courseNumber:number) {
  const key = `${term}-${subject}-${courseNumber}`;
  const [data, setData] = useState<CourseInfo | null>(cache.get(key) ?? null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cache.has(key)) {
      return;
    }
    const fetchMajors = async () => {
      try {
        const res = await (await fetch(`/api/search?term=${term}&subj=${subject}&q=${courseNumber}`))
        const json = await res.json()
        cache.set(key, json[0])
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