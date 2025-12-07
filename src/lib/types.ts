import type { Requisite } from "@/scraper/reqs";

export interface Term {
  term: string;
  name: string;
}

export interface GroupedTerms {
  neu: Term[];
  cps: Term[];
  law: Term[];
}

export interface Subject {
  label: string;
  value: string;
}

export interface CourseSearchResult {
  id: number;
  name: string;
  courseNumber: string;
  subject: string;
  maxCredits: string;
  minCredits: string;
  nupaths: string[];
  nupathNames: string[];
  prereqs: Requisite;
  coreqs: Requisite;
  postreqs: Requisite;
  totalSections: number;
  sectionsWithSeats: number;
  campus: string[];
  classType: string[];
  honors: boolean;
  score: number;
}
