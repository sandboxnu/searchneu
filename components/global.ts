import _ from 'lodash';
import { Campus } from './types';
import { gqlClient } from '../utils/courseAPIClient';
import Macros from './abstractMacros';

/** Information about a term */
interface TermInfo {
  /** Display text */
  text: string;
  /** Term ID */
  value: string;
}

function addUrlToTermInfo(url: string, term: TermInfo) {
  return { ...term, href: `/${url}/${term.value}` };
}

// Only used internally
let neuTerms: TermInfo[] | null = null;
let cpsTerms: TermInfo[] | null = null;
let lawTerms: TermInfo[] | null = null;

/**
 * Queries TermInfos for this campus from the backend
 */
async function getTermInfoBackend(c: Campus): Promise<TermInfo[]> {
  let subCollege: string;
  switch (c) {
    case Campus.NEU:
      subCollege = 'None';
      break;
    case Campus.CPS:
      subCollege = 'CPS';
      break;
    case Campus.LAW:
      subCollege = 'LAW';
      break;
  }

  const data = await gqlClient
    .getTermIDsByCollege({ subCollege: subCollege })
    .then((res) => res['termInfos']);
  // Convert to TermInfo
  let termIds: TermInfo[] = data.map((term) => {
    return {
      text: term['text'],
      value: term['termId'],
    };
  });

  // Add the URLs
  termIds = termIds.map((term) => addUrlToTermInfo(c, term));

  return termIds;
}

/*
Queries the TermInfos for this campus from the backend, or returns a cached version if we've already done so.

// TODO - should the cache have a temporary existance? Otherwise, we won't re-hit the backend until the next time the program is resarted.
*/
export async function getTermInfoForCampus(c: Campus): Promise<TermInfo[]> {
  switch (c) {
    case Campus.NEU:
      return neuTerms !== null ? neuTerms : getTermInfoBackend(c);
    case Campus.CPS:
      return cpsTerms !== null ? cpsTerms : getTermInfoBackend(c);
    case Campus.LAW:
      return lawTerms !== null ? lawTerms : getTermInfoBackend(c);
    default:
      return [];
  }
}

export async function getLatestTerm(c: Campus): Promise<string> {
  let terms = await getTermInfoForCampus(c);
  if (terms.length > 0) {
    return terms[0].value as string;
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
  termId: number
): boolean {
  return _.some(terminfos, (option) => {
    const diff = Number(option.value) - termId;
    return diff > 0 && diff % 10 === 0;
  });
}

export async function notMostRecentTerm(termId: string): Promise<boolean> {
  const campus = getCampusByLastDigit(termId.charAt(termId.length - 1));
  const termIdNum = Number(termId);

  return greaterTermExists(await getTermInfoForCampus(campus), termIdNum);
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

// Get the term within the given campus that is closest to the given term (in a diff campus)
export async function getRoundedTerm(
  nextCampus: Campus,
  prevTerm: string
): Promise<string> {
  // what's the logic
  // get the second to last digit

  const secondToLast = getSecondToLastDigit(prevTerm);

  // know the options of the new campus
  const options = await getTermInfoForCampus(nextCampus);

  // search in there for the value where the second to last digit
  const result = tryGetMatchingSecondToLastDigitOption(secondToLast, options);

  if (result) {
    return result.value as string;
  }
  // here, there was no result with the corresponding digit. so round down and try again.
  const roundedDownDigit = String(Number(secondToLast) - 1);
  const result2 = tryGetMatchingSecondToLastDigitOption(
    roundedDownDigit,
    options
  );
  return result2 ? (result2.value as string) : '';
}

// Get the name version of a term id
export async function getTermName(termId: string): Promise<string> {
  // gather all termId to term name mappings
  const allTermMappings = [
    ...(await getTermInfoForCampus(Campus.NEU)),
    ...(await getTermInfoForCampus(Campus.CPS)),
    ...(await getTermInfoForCampus(Campus.LAW)),
  ];

  // return first instance of the termId matching a termId in a id-name mapping
  const termName: TermInfo = allTermMappings.find(
    (termMapping: TermInfo): boolean => termMapping.value === termId
  );

  return termName && termName.text;
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
