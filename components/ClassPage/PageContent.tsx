import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { CreditsDisplay } from '../common/CreditsDisplay';
import { LastUpdated } from '../common/LastUpdated';
import { getCampusByLastDigit, getSeason, getYear } from '../global';
import { Campus } from '../types';

type PageContentProps = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function PageContent({
  classPageInfo,
}: PageContentProps): ReactElement {
  const router = useRouter();

  return (
    <div className="pageContent">
      <span className="backToResults" onClick={() => router.back()}>
        Back to Search Results
      </span>
      {classPageInfo &&
        (classPageInfo.class ? (
          <div className="classPageInfoContent">
            <ClassPageInfoHeader
              classPageInfo={classPageInfo}
            ></ClassPageInfoHeader>
            <div className="horizontalLine" />
            <ClassPageInfoBody
              classPageInfo={classPageInfo}
            ></ClassPageInfoBody>
            <div className="horizontalLine" />
            <div className="horizontalLine" />
            <div className="horizontalLine" />
            <div className="horizontalLine" />
            <div className="horizontalLine" />
            <div className="horizontalLine" />
          </div>
        ) : (
          <p>This class page does not exist :(</p>
        ))}
    </div>
  );
}

function ClassPageInfoHeader({
  classPageInfo,
}: PageContentProps): ReactElement {
  return (
    <>
      <div className="title">
        <div className="titleItems">
          <h1 className="classCode">{`${classPageInfo.class.subject.toUpperCase()}${
            classPageInfo.class.classId
          }`}</h1>
          <h2 className="className">{classPageInfo.class.name}</h2>
          <LastUpdated
            host={classPageInfo.class.latestOccurrence.host}
            prettyUrl={classPageInfo.class.latestOccurrence.prettyUrl}
            lastUpdateTime={classPageInfo.class.latestOccurrence.lastUpdateTime}
          ></LastUpdated>
        </div>
      </div>

      <CreditsDisplay
        maxCredits={classPageInfo.class.latestOccurrence.maxCredits}
        minCredits={classPageInfo.class.latestOccurrence.minCredits}
      ></CreditsDisplay>
    </>
  );
}

function ClassPageInfoBody({ classPageInfo }: PageContentProps): ReactElement {
  return (
    <div className="classPageBody">
      <div className="classPageBodyLeft">
        <HeaderBody
          header="COURSE DESCRIPTION"
          body={classPageInfo.class.latestOccurrence.desc}
        />
        <HeaderBody
          header="COURSE LEVEL"
          body={getCourseLevel(
            classPageInfo.class.latestOccurrence.termId.toString()
          )}
        ></HeaderBody>
      </div>
      <div className="classPageBodyRight">
        <HeaderBody
          header="RECENT PROFESSORS"
          body={getProfessors(classPageInfo, 7).join(', ')}
        ></HeaderBody>
        <HeaderBody
          header="RECENT SEMESTERS"
          body={getRecentSemesterNames(classPageInfo).join(', ')}
        ></HeaderBody>
      </div>
    </div>
  );
}

function HeaderBody({ header, body }: Record<string, string>): ReactElement {
  return (
    <>
      <h4 className="classPageHeader">{header}</h4>
      <p>{body}</p>
    </>
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
  classPageInfo: GetClassPageInfoQuery
): string[] {
  return classPageInfo.class.allOccurrences.map((occurrence) => {
    const termId = occurrence.termId.toString();
    return `${getSeason(termId)} ${getYear(termId)}`;
  });
}
