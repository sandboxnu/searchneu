import React, { ReactElement, useState } from 'react';
import { GetClassPageInfoQuery } from '../../../generated/graphql';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import { getProfessors, getRecentSemesterNames } from '../ClassPageInfoBody';

export const SupportedInfoTypes = {
  RecentProfessors: 'RECENT PROFESSORS',
  RecentSemestersOffered: 'RECENT SEMESTERS OFFERED',
  NUPaths: 'NUPATHS',
  Prerequisites: 'PREREQUISITES',
  Corequisites: 'COREQUISITES',
  PrerequisiteFor: 'PREREQUISITE FOR',
  OptionalPreresequisiteFor: 'OPTIONAL PREREQUISITE FOR',
};

export type MobileClassInfoExpandableProps = {
  type: string;
  classPageInfo: GetClassPageInfoQuery;
};

export default function MobileClassInfoExpandable({
  type,
  classPageInfo,
}: MobileClassInfoExpandableProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mobileClassInfoExpandable">
      <div
        className={
          expanded
            ? 'mobileClassInfoExpandable__header--expanded'
            : 'mobileClassInfoExpandable__header'
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
          {renderInfo(type, classPageInfo)}
        </div>
      )}
    </div>
  );
}

const renderInfo = (
  type: string,
  classPageInfo: GetClassPageInfoQuery
): ReactElement => {
  switch (type) {
    case SupportedInfoTypes.RecentProfessors:
      return (
        <ul>
          {getProfessors(classPageInfo, 5).map((prof) => {
            return <li>{prof}</li>;
          })}
        </ul>
      );

    case SupportedInfoTypes.RecentSemestersOffered:
      return (
        <ul>
          {getRecentSemesterNames(classPageInfo, 5).map((semester) => {
            return <li>{semester}</li>;
          })}
        </ul>
      );

    case SupportedInfoTypes.NUPaths:
      return classPageInfo.class.latestOccurrence.nupath.length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {classPageInfo.class.latestOccurrence.nupath.map((nupath) => {
            return <li>{nupath}</li>;
          })}
        </ul>
      );

    // TODO: needs a design
    // case SupportedInfoTypes.Prerequisites:

    default:
      return <p>Unable to load more information.</p>;
  }
};
