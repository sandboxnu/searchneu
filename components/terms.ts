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
export async function fetchTermInfo(): Promise<{ [key: string]: TermInfo[] }> {
  // Creates a dict of {campus : TermInfo[] }
  const termInfos = {};

  for (const college of Object.keys(Campus)) {
    const terms: TermInfo[] = (
      await gqlClient.getTermIDsByCollege({ subCollege: college })
    )['termInfos'].map((term) => {
      return {
        text: term['text'],
        value: term['termId'],
        href: `/${college}/${term['termId']}`,
      };
    });

    termInfos[college] = terms;
  }

  return termInfos;
}

// Returns the latest (ie. most recent) term for the given campus
export function getLatestTerm(
  termInfos: { [key: string]: TermInfo[] },
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

function getSecondToLastDigit(s: string): string {
  return s.charAt(s.length - 2);
}

function tryGetMatchingSecondToLastDigitOption(
  secondToLast: string,
  options: TermInfo[]
): TermInfo | undefined {
  for (const option of options) {
    const secondToLastOfOption = getSecondToLastDigit(option.value as string);
    if (secondToLast === secondToLastOfOption) {
      return option;
    }
  }

  return undefined;
}

/** Get the term within the given campus that is closest to the given term (in a diff campus) */
export function getRoundedTerm(
  termInfos: { [key: string]: TermInfo[] },
  nextCampus: Campus,
  prevTerm: string
): string {
  // get the second to last digit
  const secondToLast = getSecondToLastDigit(prevTerm);

  // search in there for the value where the second to last digit
  const result = tryGetMatchingSecondToLastDigitOption(
    secondToLast,
    termInfos[nextCampus]
  );

  if (result) {
    return result.value as string;
  }
  // here, there was no result with the corresponding digit. so round down and try again.
  const roundedDownDigit = String(Number(secondToLast) - 1);
  const result2 = tryGetMatchingSecondToLastDigitOption(
    roundedDownDigit,
    termInfos[nextCampus]
  );
  return result2 ? (result2.value as string) : '';
}

// Get the name version of a term id
export function getTermName(
  termInfos: { [key: string]: TermInfo[] },
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
  const seasonDigit = getSecondToLastDigit(termId);
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
