import _ from 'lodash';
import { DropdownItemProps } from 'semantic-ui-react';
import { Campus } from './types';

export const neuTermDropdownOptions: DropdownItemProps[] = [
  { text: 'Summer II 2021', value: '202160' },
  { text: 'Summer Full 2021', value: '202150' },
  { text: 'Summer I 2021', value: '202140' },
  { text: 'Spring 2021', value: '202130' },
  { text: 'Fall 2020', value: '202110' },
  { text: 'Summer I 2020', value: '202040' },
  { text: 'Summer Full 2020', value: '202050' },
  { text: 'Summer II 2020', value: '202060' },
];
// spring 2021 CPS semester
export const cpsTermDropdownOptions: DropdownItemProps[] = [
  { text: 'Summer 2021 Semester', value: '202154' },
  { text: 'Summer 2021 Quarter', value: '202155' },
  { text: 'Spring 2021 Semester ', value: '202134' },
  { text: 'Spring 2021 Quarter', value: '202135' },
  { text: 'Winter 2020 Quarter', value: '202125' },
  { text: 'Fall 2020 Semester', value: '202114' },
  { text: 'Fall 2020 Quarter', value: '202115' },
  { text: 'Summer 2020 Semester', value: '202054' },
  { text: 'Summer 2020 Quarter', value: '202055' },
];

export const lawTermDropdownOptions: DropdownItemProps[] = [
  { text: 'Summer 2021 Semester', value: '202152' },
  { text: 'Summer 2021 Quarter', value: '202158' },
  { text: 'Spring 2021 Semester', value: '202132' },
  { text: 'Spring 2021 Quarter', value: '202138' },
  { text: 'Winter 2020 Quarter', value: '202128' },
  { text: 'Fall 2020 Semester', value: '202112' },
  { text: 'Fall 2020 Quarter', value: '202118' },
  { text: 'Summer 2020 Semester', value: '202052' },
  { text: 'Summer 2020 Quarter', value: '202058' },
];

export const campusDropdownOptions: DropdownItemProps[] = [
  { text: 'NEU', value: 'NEU' },
  { text: 'CPS', value: 'CPS' },
  { text: 'Law', value: 'LAW' },
];

export function getAllCampusDropdownOptions(): DropdownItemProps[] {
  return campusDropdownOptions;
}

export function getTermDropdownOptionsForCampus(
  c: Campus
): DropdownItemProps[] {
  switch (c) {
    case Campus.NEU:
      return neuTermDropdownOptions;
    case Campus.CPS:
      return cpsTermDropdownOptions;
    case Campus.LAW:
      return lawTermDropdownOptions;
    default:
      return [];
  }
}

export function getLatestTerm(c: Campus): string {
  switch (c) {
    case Campus.NEU:
      return neuTermDropdownOptions[0].value as string;
    case Campus.CPS:
      return cpsTermDropdownOptions[0].value as string;
    case Campus.LAW:
      return lawTermDropdownOptions[0].value as string;
    default:
      return '';
  }
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
  dropdownOptions: DropdownItemProps[],
  termId: number
): boolean {
  return _.some(dropdownOptions, (option) => {
    const diff = Number(option.value) - termId;
    return diff > 0 && diff % 10 === 0;
  });
}

export function notMostRecentTerm(termId: string): boolean {
  const campus = getCampusByLastDigit(termId.charAt(termId.length - 1));
  const termIdNum = Number(termId);
  switch (campus) {
    case Campus.NEU:
      return greaterTermExists(neuTermDropdownOptions, termIdNum);
    case Campus.CPS:
      return greaterTermExists(cpsTermDropdownOptions, termIdNum);
    case Campus.LAW:
      return greaterTermExists(lawTermDropdownOptions, termIdNum);
    default:
      throw new Error('Unrecognized campus type.');
  }
}

function getSecondToLastDigit(s: string): string {
  return s.charAt(s.length - 2);
}

function tryGetMatchingSecondToLastDigitOption(
  secondToLast: string,
  options: DropdownItemProps[]
): DropdownItemProps | undefined {
  for (const option of options) {
    const secondToLastOfOption = getSecondToLastDigit(option.value as string);
    if (secondToLast === secondToLastOfOption) {
      return option;
    }
  }

  return undefined;
}

// Get the term within the given campus that is closest to the given term (in a diff campus)
export function getRoundedTerm(nextCampus: Campus, prevTerm: string): string {
  // what's the logic
  // get the second to last digit
  const secondToLast = getSecondToLastDigit(prevTerm);

  // know the options of the new campus
  const options = getTermDropdownOptionsForCampus(nextCampus);

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
  return result2.value as string;
}

// Get the name version of a term id
export function getTermName(termId: string): string {
  // gather all termId to term name mappings
  const allTermMappings = [
    ...neuTermDropdownOptions,
    ...cpsTermDropdownOptions,
    ...lawTermDropdownOptions,
  ];
  // return first instance of the termId matching a termId in a id-name mapping
  const termName: Record<string, string> = allTermMappings.find(
    (termMapping: Record<string, string>): boolean =>
      termMapping['value'] === termId
  );

  return termName && termName['text'];
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
