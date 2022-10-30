import _ from 'lodash';
import { Campus } from './types';
import { gqlClient } from '../utils/courseAPIClient';

/** Information about a term */
export interface TermInfo {
  /** Display text */
  text: string;
  /** Term ID */
  value: string;
  href: string;
}

/**
 * Queries the backend for information about the terms for all campuses
 */
export async function fetchTermInfo(): Promise<{
  error: Error | null;
  termInfos: Record<Campus, TermInfo[]>;
}> {
  // Creates a dict of {campus : TermInfo[] }
  const allTermInfos = {
    [Campus.NEU]: [],
    [Campus.CPS]: [],
    [Campus.LAW]: [],
  };

  const termInfosWithError = {
    error: null,
    termInfos: allTermInfos,
  };

  for (const college of Object.keys(Campus)) {
    // Query the TermInfos from the GraphQL client
    try {
      const rawTermInfos = await gqlClient.getTermIDsByCollege({
        subCollege: college,
      });
      // Map the TermInfos to add a link parameter
      termInfosWithError.termInfos[college] = rawTermInfos['termInfos'].map(
        (term) => {
          return {
            text: term['text'],
            value: term['termId'],
            href: `/${college}/${term['termId']}`,
          };
        }
      );
    } catch (e) {
      termInfosWithError.error = e;
    }
  }

  return termInfosWithError;
}

// Returns the latest (ie. most recent) term for the given campus
export function getLatestTerm(
  termInfos: Record<Campus, TermInfo[]>,
  c: Campus
): string {
  const campusTerms = termInfos[c];
  if (campusTerms.length > 0) {
    return campusTerms[0].value as string;
  }
  return '';
}

export function getCampusByLastDigit(t: string): Campus {
  switch (t) {
    case '0':
      return Campus.NEU;
    case '2':
    case '8':
      return Campus.LAW;
    case '4':
    case '5':
      return Campus.CPS;
    default:
      throw new Error('unexpected campus digit');
  }
}

export function greaterTermExists(
  terminfos: TermInfo[],
  termId: string
): boolean {
  return _.some(terminfos, (option) => {
    const diff = Number(option.value) - Number(termId);
    return diff > 0 && diff % 10 === 0;
  });
}

/** Get the term within the given campus that is closest to the given term (in a diff campus) */
export function getRoundedTerm(
  termInfos: Record<Campus, TermInfo[]>,
  nextCampus: Campus,
  prevTerm: string
): string {
  const prevTermInt = Number(prevTerm);

  const closestTerm = termInfos[nextCampus].reduce(
    (prev, current: TermInfo) => {
      const curTermInt = Number(current.value);
      const diff = Math.abs(prevTermInt - curTermInt);
      // Returns the term which is closest to the previous term
      if (diff < prev.diff) {
        return { termStr: current.value, diff: diff };
      }
      return prev;
      // Initial value (which will always be replaced)
    },
    { termStr: '', diff: Number.MAX_SAFE_INTEGER }
  );

  return closestTerm.termStr;
}

// Get the name version of a term id
export function getTermName(
  termInfos: Record<Campus, TermInfo[]>,
  termId: string
): string {
  // gather all termId to term name mappings
  const allTermMappings: TermInfo[] = Object.values(termInfos).reduce(
    (prev, cur) => {
      return prev.concat(cur);
    },
    []
  );

  // return first instance of the termId matching a termId in a id-name mapping
  const termName = allTermMappings.find(
    (termMapping: TermInfo): boolean => termMapping.value === termId
  );

  return termName ? termName.text : '';
}

export function getSeason(termId: string): string {
  const seasonDigit = termId.charAt(termId.length - 2);
  const seasonDigitMap = {
    '1': 'Fall',
    '2': 'Winter',
    '3': 'Spring',
    '4': 'Summer I',
    '5': 'Summer Full',
    '6': 'Summer II',
  };
  if (!seasonDigitMap[seasonDigit]) throw new Error('unexpected season digit');
  else return seasonDigitMap[seasonDigit];
}

// returns the year the term occurs in
// ex: 202110 is Fall 2020 not Fall 2021
export function getYear(termId: string): number {
  const givenYear: number = parseInt(termId.substr(0, 4));
  const season = getSeason(termId);
  if (season === 'Fall' || season === 'Winter') {
    return givenYear - 1;
  } else {
    return givenYear;
  }
}
