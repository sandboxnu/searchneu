import Link from 'next/link';
import React, { ReactElement } from 'react';
import RequisiteTree from '../../components/icons/requisites_tree.svg';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { getCampusByLastDigit, getSeason, getYear } from '../terms';
import { Campus } from '../types';
import PrereqsDisplay from './PrereqsDisplay';
import HeaderBody from './HeaderBody';
import nupathToId from '../../utils/nuPathToID';

type ClassPageReqsBodyProps = {
  termId: string;
  campus: string;
  classPageInfo: GetClassPageInfoQuery;
};

export function ClassPageReqsBody({
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
            <a href={latestOccurrence.prettyUrl}>
              Click here to view this course on the Northeastern website.
            </a>
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
            latestOccurrence.prereqsFor.length === 0 ? (
              <span className="noReqs">None</span>
            ) : (
              <div
                className={`reqItemsContainer ${
                  latestOccurrence.prereqsFor.length > 3 ? 'showScroll' : ''
                }`}
              >
                <div className="reqItemsScroll">
                  {latestOccurrence.prereqsFor.map((value) => {
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

export function MobileClassPageReqsBody({
  termId,
  campus,
  classPageInfo,
}: ClassPageReqsBodyProps): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;

  function getCourseLevel(termId: string): string {
    const termIdLastDigit = termId.charAt(termId.length - 1);
    const campus = getCampusByLastDigit(termIdLastDigit);
    return campus === Campus.NEU ? 'Undergraduate' : 'Graduate';
  }

  return (
    <div className="mobileClassPageReqsBody">
      <div className="mobileClassPageReqsBody--req" style={{ gap: '5px' }}>
        <span className="mobileClassPageReqsBody--header">NUPaths</span>
        {latestOccurrence.nupath.length === 0 ? (
          <span className="noNUPaths">None</span>
        ) : (
          latestOccurrence.nupath
            .map((nupath) => nupath + ' (' + nupathToId(nupath) + ')')
            .map((id) => (
              <span className="mobileClassPageReqsBody--nuPathBadge" key={id}>
                {id}
              </span>
            ))
        )}
      </div>
      <div className="mobileClassPageReqsBody--rowDouble">
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">Course Level</span>
          {getCourseLevel(latestOccurrence.termId.toString())}
        </div>
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">Link</span>
          <a
            href={latestOccurrence.prettyUrl}
            style={{ textDecoration: 'underline' }}
          >
            View this course on the Northeastern website
          </a>
        </div>
      </div>
      <div className="mobileClassPageReqsBody--rowDouble">
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">
            Prerequisites{' '}
            <RequisiteTree
              style={{ transform: 'scale(0.6)', verticalAlign: 'middle' }}
            />
          </span>
          {latestOccurrence.prereqs.values.length === 0 ? (
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
          )}
        </div>
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">Corequisites</span>
          {latestOccurrence.coreqs.values.length === 0 ? (
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
          )}
        </div>
      </div>
      <div className="mobileClassPageReqsBody--rowDouble">
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">
            Prerequisite for{' '}
            <RequisiteTree
              style={{ transform: 'scale(0.6)', verticalAlign: 'middle' }}
            />
          </span>
          {latestOccurrence.prereqsFor.length === 0 ? (
            <span className="noReqs">None</span>
          ) : (
            <div
              className={`reqItemsContainer ${
                latestOccurrence.prereqsFor.length > 3 ? 'showScroll' : ''
              }`}
            >
              <div className="reqItemsScroll">
                {latestOccurrence.prereqsFor.map((value) => {
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
          )}
        </div>
        <div className="mobileClassPageReqsBody--req">
          <span className="mobileClassPageReqsBody--header">
            Optional Prerequisite for
          </span>
          {latestOccurrence.optPrereqsFor.values.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
