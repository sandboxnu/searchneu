import Link from 'next/link';
import React, { ReactElement } from 'react';
import RequisiteTree from '../../components/icons/requisites_tree.svg';
import { isCompositeReq } from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, CourseReq, Requisite } from '../types';
import { HeaderBody } from './HeaderBody';
import { GetClassPageInfoQuery } from '../../generated/graphql';

type ClassPageReqsBodyProps = {
  termId: string;
  campus: string;
  classPageInfo: GetClassPageInfoQuery;
};

type PrereqsDisplayProps = {
  termId: string;
  campus: string;
  prereqs: Requisite;
  indents: number;
};

export default function ClassPageReqsBody({
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
          body={
            latestOccurrence.nupath.length === 0 ? (
              <span className="noNUPaths">None</span>
            ) : (
              latestOccurrence.nupath.map((nupath, index) => (
                <p key={index}>{nupath}</p>
              ))
            )
          }
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
                className={`reqItemsContainer ${
                  latestOccurrence.prereqsFor.values.length > 3
                    ? 'showScroll'
                    : ''
                }`}
              >
                <div className="reqItemsScroll">
                  {latestOccurrence.prereqsFor.values.map((value) => {
                    return (
                      <div
                        className="reqItem"
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
              <div
                className={`reqItemsContainer ${
                  latestOccurrence.optPrereqsFor.values.length > 3
                    ? 'showScroll'
                    : ''
                }`}
              >
                <div className="reqItemsScroll">
                  {latestOccurrence.optPrereqsFor.values.map((value) => {
                    return (
                      <div
                        className="reqItem"
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
        {/* <HeaderBody
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
        /> */}
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
