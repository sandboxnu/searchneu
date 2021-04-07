import { mean } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import RequisiteTree from '../../components/icons/requisites_tree.svg';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { isCompositeReq } from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, CourseReq, Requisite } from '../types';
import { HeaderBody } from './HeaderBody';
import { PageContentHeader } from './PageContentHeader';
import {
  getCourseLevel,
  getProfessors,
  getRecentSemesterNames,
  numberOfSections,
  seatsAvailable,
  seatsFilled,
} from './PageContentService';

type PageContentProps = {
  termId: string;
  campus: string;
  subject: string;
  classId: string;
  classPageInfo: GetClassPageInfoQuery;
  isCoreq: boolean;
};

type ClassPageReqsBodyProps = {
  termId: string;
  campus: string;
  classPageInfo: GetClassPageInfoQuery;
};

type ClassPageInfoProp = {
  classPageInfo: GetClassPageInfoQuery;
};

type PrereqsDisplayProps = {
  termId: string;
  campus: string;
  prereqs: Requisite;
  indents: number;
};

export default function PageContent({
  termId,
  campus,
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
          <PageContentHeader classPageInfo={classPageInfo} />
          <div className="horizontalLine" />
          <ClassPageInfoBody classPageInfo={classPageInfo} />
          <div className="horizontalLine" />
          <ClassPageReqsBody
            termId={termId}
            campus={campus}
            classPageInfo={classPageInfo}
          />
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

function ClassPageInfoBody({ classPageInfo }: ClassPageInfoProp): ReactElement {
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

function ClassPageReqsBody({
  termId,
  campus,
  classPageInfo,
}: ClassPageReqsBodyProps): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;

  return (
    <div className="classPageReqsBody">
      <div className="flex justify-space-between">
        <HeaderBody
          header="NUPATHS"
          className="nupaths"
          body={latestOccurrence.nupath.map((nupath, index) => (
            <p key={index}>{nupath}</p>
          ))}
        />
        <HeaderBody
          header={
            <>
              PREREQUISITES <RequisiteTree />
            </>
          }
          className="prereqs"
          body={
            latestOccurrence.prereqs.values.length === 0 ? (
              <span className="noReqs">None</span>
            ) : (
              <>
                <span>Must Take </span>
                <PrereqsDisplay
                  termId={termId}
                  campus={campus}
                  prereqs={latestOccurrence.prereqs}
                  indents={0}
                ></PrereqsDisplay>
              </>
            )
          }
        />
        <HeaderBody
          header="COREQUISITES"
          className="coreqs"
          body={
            latestOccurrence.coreqs.values.length === 0 ? (
              <span className="noReqs">None</span>
            ) : (
              latestOccurrence.coreqs.values.map((value) => {
                return (
                  <div key={value.subject + value.classId}>
                    <Link
                      href={`/${campus}/${termId}/classPage/${value.subject}/${value.classId}`}
                    >{`${value.subject} ${value.classId}`}</Link>
                  </div>
                );
              })
            )
          }
        />
      </div>
      <div className="flex justify-space-between">
        <HeaderBody
          header="LINK"
          className="link"
          body={
            <Link href={latestOccurrence.prettyUrl}>
              Click here to view this course on the Northeastern website.
            </Link>
          }
        />
        <HeaderBody
          header={
            <>
              PREREQUISITE for <RequisiteTree />
            </>
          }
          className="prereqsFor"
          body={
            latestOccurrence.prereqsFor.values.length === 0 ? (
              <span className="noReqs">None</span>
            ) : (
              <div
                className={`prereqsForItemContainer ${
                  latestOccurrence.prereqsFor.values.length > 3
                    ? 'showScroll'
                    : ''
                }`}
              >
                <div className="prereqsForScroll">
                  {latestOccurrence.prereqsFor.values.map((value) => {
                    return (
                      <div
                        className="prereqsForItem"
                        key={value.subject + value.classId}
                      >
                        <Link
                          href={`/${campus}/${termId}/classPage/${value.subject}/${value.classId}`}
                        >{`${value.subject} ${value.classId}`}</Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          }
        />
        <HeaderBody
          header={
            <>
              Optional PREREQUISITE for <RequisiteTree />
            </>
          }
          className="optPrereqsFor"
          body={
            latestOccurrence.optPrereqsFor.values.length === 0 ? (
              <span className="noReqs">None</span>
            ) : (
              latestOccurrence.optPrereqsFor.values.map((value) => {
                return (
                  <div key={value.subject + value.classId}>
                    <Link
                      href={`/${campus}/${termId}/classPage/${value.subject}/${value.classId}`}
                    >{`${value.subject} ${value.classId}`}</Link>
                  </div>
                );
              })
            )
          }
        />
      </div>
    </div>
  );
}

function PrereqsDisplay({
  termId,
  campus,
  prereqs,
  indents,
}: PrereqsDisplayProps): ReactElement {
  if (isCompositeReq(prereqs)) {
    const prereq: CompositeReq = prereqs as CompositeReq;
    if (prereq.values.length === 0) {
      return <span>None</span>;
    } else if (prereq.values.length === 1) {
      return (
        <PrereqsDisplay
          termId={termId}
          campus={campus}
          prereqs={prereq.values[0]}
          indents={indents}
        ></PrereqsDisplay>
      );
    } else {
      return (
        <div className="prereqsDisplay">
          {Array(indents)
            .fill(0)
            .map((val, index) => (
              <span key={index}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
            ))}
          <span>{prereq.type === 'and' ? 'Each of :' : 'One of :'}</span>
          {prereq.values.map((value, index) => (
            <PrereqsDisplay
              key={index}
              termId={termId}
              campus={campus}
              prereqs={value}
              indents={indents + 1}
            ></PrereqsDisplay>
          ))}
        </div>
      );
    }
  } else {
    const prereq: CourseReq = prereqs as CourseReq;
    return (
      <div key={prereq.subject + prereq.classId}>
        {Array(indents)
          .fill(0)
          .map((val, index) => (
            <span key={index}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
          ))}
        <Link
          href={`/${campus}/${termId}/classPage/${prereq.subject}/${prereq.classId}`}
        >{`${prereq.subject} ${prereq.classId}`}</Link>
      </div>
    );
  }
}
