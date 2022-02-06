import { mean } from 'lodash';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { getCampusByLastDigit, getSeason, getYear } from '../terms';
import { Campus } from '../types';
import HeaderBody from './HeaderBody';

type ClassPageInfoProp = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function ClassPageInfoBody({
  classPageInfo,
}: ClassPageInfoProp): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;
  return (
    <div className="classPageBody flex justify-space-between">
      <div className="classPageBodyLeft">
        <HeaderBody
          header="COURSE DESCRIPTION"
          body={<p>{latestOccurrence.desc}</p>}
        />
        <HeaderBody
          header="COURSE LEVEL"
          body={<p>{getCourseLevel(latestOccurrence.termId.toString())}</p>}
        />
      </div>
      <div className="verticalLine" />
      <div className="classPageBodyRight">
        <HeaderBody
          header="RECENT PROFESSORS"
          body={<p>{getProfessors(classPageInfo, 10).join(', ')}</p>}
        />
        <HeaderBody
          header="RECENT SEMESTERS"
          body={<p>{getRecentSemesterNames(classPageInfo, 6).join(', ')}</p>}
        />
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgSeatsFilled"
            header="AVG SEATS FILLED"
            body={<p>{Math.round(mean(seatsFilled(classPageInfo)))}</p>}
          />
          <HeaderBody
            className="lg-text avgSeatsAvail"
            header="AVG SEATS AVAILABLE"
            body={<p>{Math.round(mean(seatsAvailable(classPageInfo)))}</p>}
          />
        </div>
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgNumSections"
            header="AVG # SECTIONS"
            body={<p>{Math.round(mean(numberOfSections(classPageInfo)))}</p>}
          />
          <HeaderBody
            className={`lg-text courseFees ${
              latestOccurrence.feeAmount ? '' : 'emptyCourseFee'
            } `}
            header="COURSE FEES"
            body={
              <p>
                {latestOccurrence.feeAmount
                  ? `$${latestOccurrence.feeAmount.toLocaleString()}`
                  : 'None'}
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}

function getCourseLevel(termId: string): string {
  const termIdLastDigit = termId.charAt(termId.length - 1);
  const campus = getCampusByLastDigit(termIdLastDigit);
  return campus === Campus.NEU ? 'Undergraduate' : 'Graduate';
}

function getProfessors(
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

function getRecentSemesterNames(
  classPageInfo: GetClassPageInfoQuery,
  limit: number
): string[] {
  const allSemesters = classPageInfo.class.allOccurrences.map((occurrence) => {
    const termId = occurrence.termId.toString();
    return `${getSeason(termId)} ${getYear(termId)}`;
  });
  return allSemesters.slice(0, Math.min(limit, allSemesters.length));
}

function seatsFilled(classPageInfo: GetClassPageInfoQuery): number[] {
  return getValidSections(classPageInfo).map(
    (section) => section.seatsCapacity - section.seatsRemaining
  );
}

function seatsAvailable(classPageInfo: GetClassPageInfoQuery): number[] {
  return getValidSections(classPageInfo).map(
    (section) => section.seatsCapacity
  );
}

function numberOfSections(classPageInfo: GetClassPageInfoQuery): number[] {
  return classPageInfo.class.allOccurrences.map(
    (occurrence) => occurrence.sections.length
  );
}

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
