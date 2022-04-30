import React, { ReactElement, useState } from 'react';
import Link from 'next/link';
import { GetClassPageInfoQuery } from '../../../generated/graphql';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import { getProfessors, getRecentSemesterNames } from '../ClassPageInfoBody';
import MobilePrereqsDisplay from './MobilePrereqsDisplay';

export const SupportedInfoTypes = {
  RecentProfessors: 'RECENT PROFESSORS',
  RecentSemestersOffered: 'RECENT SEMESTERS OFFERED',
  NUPaths: 'NUPATHS',
  Prerequisites: 'PREREQUISITES',
  Corequisites: 'COREQUISITES',
  PrerequisiteFor: 'PREREQUISITE FOR',
  OptionalPreresequisiteFor: 'OPTIONAL PREREQUISITE FOR',
};

type MobileClassInfoExpandableProps = {
  type: string;
  classPageInfo: GetClassPageInfoQuery;
  termId: string;
  campus: string;
};

export default function MobileClassInfoExpandable({
  type,
  classPageInfo,
  termId,
  campus,
}: MobileClassInfoExpandableProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mobileClassInfoExpandable">
      <div
        className={
          'mobileClassInfoExpandable__header' + (expanded ? '--expanded' : '')
        }
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
      >
        <IconCollapseExpand width="6" height="11" className="carrot" />
        <u>{type}</u>
      </div>

      {expanded && (
        <div className="mobileClassInfoExpandable__panel">
          {renderInfo(type, classPageInfo, termId, campus)}
        </div>
      )}
    </div>
  );
}

const renderInfo = (
  type: string,
  classPageInfo: GetClassPageInfoQuery,
  termId: string,
  campus: string
): ReactElement => {
  switch (type) {
    case SupportedInfoTypes.RecentProfessors:
      return getProfessors(classPageInfo, 1).length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {getProfessors(classPageInfo, 5).map((prof, index) => {
            return <li key={`prof${index}`}>{prof}</li>;
          })}
        </ul>
      );

    case SupportedInfoTypes.RecentSemestersOffered:
      return getRecentSemesterNames(classPageInfo, 1).length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {getRecentSemesterNames(classPageInfo, 5).map((semester, index) => {
            return <li key={`sem${index}`}>{semester}</li>;
          })}
        </ul>
      );

    case SupportedInfoTypes.NUPaths:
      return classPageInfo.class.latestOccurrence.nupath.length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {classPageInfo.class.latestOccurrence.nupath.map((nupath, index) => {
            return <li key={`nupath${index}`}>{nupath}</li>;
          })}
        </ul>
      );

    case SupportedInfoTypes.Prerequisites:
      return (
        <div className="mobilePrereqsDisplay">
          <MobilePrereqsDisplay
            termId={termId}
            campus={campus}
            prereqs={classPageInfo.class.latestOccurrence.prereqs}
            level={0}
          />
        </div>
      );

    case SupportedInfoTypes.Corequisites:
      return (
        <div className="mobilePrereqsDisplay">
          <MobilePrereqsDisplay
            termId={termId}
            campus={campus}
            prereqs={classPageInfo.class.latestOccurrence.coreqs}
            level={0}
          />
        </div>
      );

    case SupportedInfoTypes.PrerequisiteFor:
      return classPageInfo.class.latestOccurrence.prereqsFor.values.length ===
        0 ? (
        <p>None</p>
      ) : (
        <ul>
          {classPageInfo.class.latestOccurrence.prereqsFor.values.map(
            (parentClass, index) => {
              return (
                <li key={`prereqFor${index}`}>
                  <Link
                    href={`/${campus}/${termId}/classPage/${parentClass.subject}/${parentClass.classId}`}
                  >{`${parentClass.subject} ${parentClass.classId}`}</Link>
                </li>
              );
            }
          )}
        </ul>
      );

    case SupportedInfoTypes.OptionalPreresequisiteFor:
      return classPageInfo.class.latestOccurrence.optPrereqsFor.values
        .length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {classPageInfo.class.latestOccurrence.optPrereqsFor.values.map(
            (parentClass, index) => {
              return (
                <li key={`optPrereqFor${index}`}>
                  <Link
                    href={`/${campus}/${termId}/classPage/${parentClass.subject}/${parentClass.classId}`}
                  >{`${parentClass.subject} ${parentClass.classId}`}</Link>
                </li>
              );
            }
          )}
        </ul>
      );

    default:
      return <p>Unable to load more information.</p>;
  }
};
