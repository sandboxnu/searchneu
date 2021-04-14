import { mean } from 'lodash';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import {
  creditsDescription,
  creditsNumericDisplay,
} from '../common/CreditsDisplay';
import { LastUpdated } from '../common/LastUpdated';
import { getCampusByLastDigit, getSeason, getYear } from '../global';
import { Campus } from '../types';

type PageContentProps = {
  subject: string;
  classId: string;
  classPageInfo: GetClassPageInfoQuery;
  isCoreq: boolean;
};

type ClassPageInfoProp = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function PageContent({
  subject,
  classId,
  classPageInfo,
  isCoreq,
}: PageContentProps): ReactElement {
  const router = useRouter();

  return (
    <div className="pageContent">
      {isCoreq ? (
        <h2 className="coreqHeader">
          COREQUISITES for
          <span className="coreqHeaderCourse">{` ${subject}${classId}`}</span>
        </h2>
      ) : (
        <div className="backToResults" onClick={() => router.back()}>
          Back to Search Results
        </div>
      )}
      {classPageInfo && classPageInfo.class && (
        <div className="classPageInfoContent">
          <ClassPageInfoHeader classPageInfo={classPageInfo} />
          <div className="horizontalLine" />
          <ClassPageInfoBody classPageInfo={classPageInfo} />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
        </div>
      )}
    </div>
  );
}

function ClassPageInfoHeader({
  classPageInfo,
}: ClassPageInfoProp): ReactElement {
  const { subject, name, classId, latestOccurrence } = classPageInfo.class;
  return (
    <div className="classPageInfoHeader">
      <div className="title">
        <div className="titleItems">
          <h1 className="classCode">{`${subject.toUpperCase()}${classId}`}</h1>
          <h2 className="className">{name}</h2>
        </div>
      </div>
      <div className="flex justify-space-between">
        <LastUpdated
          host={latestOccurrence.host}
          prettyUrl={latestOccurrence.prettyUrl}
          lastUpdateTime={latestOccurrence.lastUpdateTime}
          iconHeight="25"
          iconWidth="24"
          className="classPageLastUpdated"
        />
        <div className="creditsDisplay">
          <span className="creditsNumericDisplay">
            {creditsNumericDisplay(
              latestOccurrence.maxCredits,
              latestOccurrence.minCredits
            )}
          </span>
          <br></br>
          <span className="creditsDescriptionDisplay">
            {creditsDescription(latestOccurrence.maxCredits)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ClassPageInfoBody({ classPageInfo }: ClassPageInfoProp): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;
  return (
    <div className="classPageBody flex justify-space-between">
      <div className="classPageBodyLeft">
        <HeaderBody header="COURSE DESCRIPTION" body={latestOccurrence.desc} />
        <HeaderBody
          header="COURSE LEVEL"
          body={getCourseLevel(latestOccurrence.termId.toString())}
        />
      </div>
      <div className="verticalLine" />
      <div className="classPageBodyRight">
        <HeaderBody
          header="RECENT PROFESSORS"
          body={getProfessors(classPageInfo, 10).join(', ')}
        />
        <HeaderBody
          header="RECENT SEMESTERS"
          body={getRecentSemesterNames(classPageInfo, 6).join(', ')}
        />
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgSeatsFilled"
            header="AVG SEATS FILLED"
            body={`${Math.round(mean(seatsFilled(classPageInfo)))}`}
          />
          <HeaderBody
            className="lg-text avgSeatsAvail"
            header="AVG SEATS AVAILABLE"
            body={`${Math.round(mean(seatsAvailable(classPageInfo)))}`}
          />
        </div>
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgNumSections"
            header="AVG # SECTIONS"
            body={`${Math.round(mean(numberOfSections(classPageInfo)))}`}
          />
          <HeaderBody
            className={`lg-text courseFees ${
              latestOccurrence.feeAmount ? '' : 'emptyCourseFee'
            } `}
            header="COURSE FEES"
            body={
              latestOccurrence.feeAmount
                ? `$${latestOccurrence.feeAmount.toLocaleString()}`
                : 'None'
            }
          />{' '}
        </div>
      </div>
    </div>
  );
}

function HeaderBody({
  header,
  body,
  className,
}: Record<string, string>): ReactElement {
  return (
    <div className={`headerBodyGroup ${className ? className : ''}`}>
      <h4 className="classPageHeader">{header}</h4>
      <p>{body}</p>
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

function numberOfSections(classPageInfo: GetClassPageInfoQuery): number[] {
  return classPageInfo.class.allOccurrences.map(
    (occurrence) => occurrence.sections.length
  );
}
