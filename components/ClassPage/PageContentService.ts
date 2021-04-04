import { getCampusByLastDigit, getSeason, getYear } from '../global';
import { Campus } from '../types';
import { GetClassPageInfoQuery } from '../../generated/graphql';

export function getCourseLevel(termId: string): string {
  const termIdLastDigit = termId.charAt(termId.length - 1);
  const campus = getCampusByLastDigit(termIdLastDigit);
  return campus === Campus.NEU ? 'Undergraduate' : 'Graduate';
}

export function getProfessors(
  classPageInfo: GetClassPageInfoQuery,
  limit: number
): string[] {
  const allOccurrences = classPageInfo.class.allOccurrences;
  const profs = new Set<string>();
  // at least display all the professors for the most recent occurrence of this course
  allOccurrences[0].sections.forEach((section) => {
    section.profs.forEach((prof) => profs.add(prof));
  });
  if (profs.size >= limit || allOccurrences.length <= 1)
    return Array.from(profs);
  else {
    allOccurrences.slice(1).forEach((occurrence) => {
      occurrence.sections.forEach((section) =>
        section.profs.forEach((prof) => profs.add(prof))
      );
    });
    return Array.from(profs).slice(0, limit);
  }
}

export function getRecentSemesterNames(
  classPageInfo: GetClassPageInfoQuery,
  limit: number
): string[] {
  const allSemesters = classPageInfo.class.allOccurrences.map((occurrence) => {
    const termId = occurrence.termId.toString();
    return `${getSeason(termId)} ${getYear(termId)}`;
  });
  return allSemesters.slice(0, Math.min(limit, allSemesters.length));
}

export function seatsFilled(classPageInfo: GetClassPageInfoQuery): number[] {
  return getValidSections(classPageInfo).map(
    (section) => section.seatsCapacity - section.seatsRemaining
  );
}

export function seatsAvailable(classPageInfo: GetClassPageInfoQuery): number[] {
  return getValidSections(classPageInfo).map(
    (section) => section.seatsCapacity
  );
}

export function numberOfSections(
  classPageInfo: GetClassPageInfoQuery
): number[] {
  return classPageInfo.class.allOccurrences.map(
    (occurrence) => occurrence.sections.length
  );
}

// Private Functions

// if there's at least one section with seatCapacity < 9999,
// returns sections excluding those with seatCapacity = 9999
function getValidSections(classPageInfo: GetClassPageInfoQuery) {
  let allSections = classPageInfo.class.allOccurrences
    .map((occurrence) => occurrence.sections)
    .flat();
  if (allSections.find((section) => section.seatsCapacity < 9999)) {
    allSections = allSections.filter((section) => section.seatsCapacity < 9999);
  }
  return allSections;
}
