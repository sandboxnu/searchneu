import Link from 'next/link';
import React, { ReactElement } from 'react';
import RequisiteTree from '../../components/icons/requisites_tree.svg';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import PrereqsDisplay from './PrereqsDisplay';
import HeaderBody from './HeaderBody';

type ClassPageReqsBodyProps = {
  termId: string;
  campus: string;
  classPageInfo: GetClassPageInfoQuery;
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
                <div>
                  <span>Must Take </span>
                </div>
                <div className="prereqsDisplay">
                  <PrereqsDisplay
                    termId={termId}
                    campus={campus}
                    prereqs={latestOccurrence.prereqs}
                    level={0}
                  ></PrereqsDisplay>
                </div>
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
      </div>
    </div>
  );
}
