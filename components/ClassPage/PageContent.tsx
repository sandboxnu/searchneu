import { mean } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import {
  creditsDescription,
  creditsNumericDisplay,
} from '../common/CreditsDisplay';
import { LastUpdated } from '../common/LastUpdated';
import { isCompositeReq } from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, CourseReq, Requisite } from '../types';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import PageContentService from './PageContentService';
import RequisiteTree from '../../components/icons/requisites_tree.svg';

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
          <ClassPageInfoHeader classPageInfo={classPageInfo} />
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
          body={PageContentService.getCourseLevel(
            latestOccurrence.termId.toString()
          )}
        />
      </div>
      <div className="verticalLine" />
      <div className="classPageBodyRight">
        <HeaderBody
          header="RECENT PROFESSORS"
          body={PageContentService.getProfessors(classPageInfo, 10).join(', ')}
        />
        <HeaderBody
          header="RECENT SEMESTERS"
          body={PageContentService.getRecentSemesterNames(
            classPageInfo,
            6
          ).join(', ')}
        />
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgSeatsFilled"
            header="AVG SEATS FILLED"
            body={`${Math.round(
              mean(PageContentService.seatsFilled(classPageInfo))
            )}`}
          />
          <HeaderBody
            className="lg-text avgSeatsAvail"
            header="AVG SEATS AVAILABLE"
            body={`${Math.round(
              mean(PageContentService.seatsAvailable(classPageInfo))
            )}`}
          />
        </div>
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgNumSections"
            header="AVG # SECTIONS"
            body={`${Math.round(
              mean(PageContentService.numberOfSections(classPageInfo))
            )}`}
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

function ClassPageReqsBody({
  termId,
  campus,
  classPageInfo,
}: ClassPageReqsBodyProps): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;

  return (
    <div className="classPageReqsBody">
      <div className="flex justify-space-between">
        <div className="headerBodyGroup nupaths">
          <h4 className="classPageHeader">NUPATHS</h4>
          {latestOccurrence.nupath.map((nupath, index) => (
            <p key={index}>{nupath}</p>
          ))}
        </div>
        <div className="headerBodyGroup prereqs">
          <h4 className="classPageHeader">
            PREREQUISITES <RequisiteTree />
          </h4>
          <span>Must Take </span>
          <PrereqsDisplay
            termId={termId}
            campus={campus}
            prereqs={classPageInfo.class.latestOccurrence.prereqs}
            indents={0}
          ></PrereqsDisplay>
        </div>
        <div className="headerBodyGroup coreqs">
          <h4 className="classPageHeader">COREQUISITES</h4>
          {latestOccurrence.coreqs.values.map((value) => {
            return (
              <div key={value.subject + value.classId}>
                <Link
                  href={`/${campus}/${termId}/classPage/${value.subject}/${value.classId}`}
                >{`${value.subject} ${value.classId}`}</Link>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-space-between">
        <div className="headerBodyGroup link">
          <h4 className="classPageHeader">LINK</h4>
          <Link href={latestOccurrence.prettyUrl}>
            Click here to view this course on the Northeastern website.
          </Link>
        </div>

        <div className="headerBodyGroup prereqsFor">
          <h4 className="classPageHeader">
            PREREQUISITE for <RequisiteTree />
          </h4>
          <div className="prereqsForItemContainer">
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
        </div>
        <div className="headerBodyGroup optPrereqsFor">
          <h4 className="classPageHeader">
            Optional PREREQUISITE for <RequisiteTree />
          </h4>
          {latestOccurrence.optPrereqsFor.values.map((value) => {
            return (
              <div key={value.subject + value.classId}>
                <Link
                  href={`/${campus}/${termId}/classPage/${value.subject}/${value.classId}`}
                >{`${value.subject} ${value.classId}`}</Link>
              </div>
            );
          })}
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
