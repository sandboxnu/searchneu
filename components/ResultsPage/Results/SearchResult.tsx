import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Markup } from 'interweave';
import { cloneDeep } from 'lodash';
import dynamic from 'next/dynamic';
import React, { ReactElement, useMemo, useState } from 'react';
import useUser from '../../../utils/useUser';
import { notMostRecentTerm } from '../../global';
import IconArrow from '../../icons/IconArrow';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import IconGlobe from '../../icons/IconGlobe';
import Keys from '../../Keys';
import { Course, PrereqType, Section } from '../../types';
import MobileCollapsableDetail from './MobileCollapsableDetail';
import { DesktopSectionPanel, MobileSectionPanel } from './SectionPanel';
import useResultDetail from './useResultDetail';
import useShowAll from './useShowAll';

const SignUpForNotifications = dynamic(
  () => import('../../SignUpForNotifications'),
  { ssr: false }
);

dayjs.extend(relativeTime);

interface SearchResultProps {
  course: Course;
}

const getLastUpdateString = (course: Course): string => {
  return course.lastUpdateTime ? dayjs(course.lastUpdateTime).fromNow() : null;
};

const sortSections = (sections: Section[]): Section[] => {
  const sortedSections = cloneDeep(sections);
  sortedSections.sort((a: Section, b: Section) => {
    if (!a.profs || !a.profs[0]) {
      return -1;
    }
    if (!b.profs || !b.profs[0]) return 1;

    if (a.profs[0] === b.profs[0]) return 0;

    return a.profs[0] < b.profs[0] ? -1 : 1;
  });
  return sortedSections;
};

export function SearchResult({ course }: SearchResultProps): ReactElement {
  const sortedSections = useMemo(() => sortSections(course.sections), [course]);
  const { optionalDisplay, creditsString } = useResultDetail(course);

  const { user } = useUser();
  const userIsWatchingClass = user?.followedCourses?.includes(
    Keys.getClassHash(course)
  );

  const { showAll, setShowAll, renderedSections, hideShowAll } = useShowAll(
    sortedSections
  );

  const feeString =
    course.feeDescription && course.feeAmount
      ? `${course.feeDescription} - $${course.feeAmount.toLocaleString()}`
      : null;

  return (
    <div className="SearchResult">
      <div className="SearchResult__header">
        <div className="SearchResult__header--left">
          <span className="SearchResult__header--classTitle">
            {course.subject} {course.classId}: {course.name}
          </span>
          <div className="SearchResult__header--sub">
            <a
              target="_blank"
              rel="noopener noreferrer"
              data-tip={`View on ${course.host}`}
              href={course.prettyUrl}
            >
              <IconGlobe />
            </a>
            <span>{`Updated ${getLastUpdateString(course)}`}</span>
          </div>
        </div>
        <span className="SearchResult__header--creditString">
          {creditsString()}
        </span>
      </div>
      <div className="SearchResult__panel">
        <Markup content={course.desc} />
        <br />
        <br />
        <div className="SearchResult__panel--main">
          <div className="SearchResult__panel--left">
            NUPaths:
            {course.nupath.length > 0 ? (
              <span> {course.nupath.join(', ')}</span>
            ) : (
              <span className="empty"> None</span>
            )}
            <br />
            Prerequisites: {optionalDisplay(PrereqType.PREREQ, course)}
            <br />
            Corequisites: {optionalDisplay(PrereqType.COREQ, course)}
            <br />
            Course fees:
            {feeString ? (
              <span> {feeString}</span>
            ) : (
              <span className="empty"> None</span>
            )}
          </div>
          <div className="SearchResult__panel--right">
            <SignUpForNotifications course={course} />
          </div>
        </div>
      </div>
      <table className="SearchResult__sectionTable">
        <thead>
          <tr>
            <th>
              <div className="inlineBlock" data-tip="Course Reference Number">
                CRN
              </div>
            </th>
            <th> Professors </th>
            <th> Meetings </th>
            <th> Campus </th>
            <th> Seats </th>
            {userIsWatchingClass && <th> Notifications </th>}
          </tr>
        </thead>
        <tbody>
          {renderedSections.map((section) => (
            <DesktopSectionPanel
              key={section.crn}
              section={section}
              showNotificationSwitches={userIsWatchingClass}
            />
          ))}
        </tbody>
      </table>
      {!hideShowAll && (
        <div
          className="SearchResult__showAll"
          role="button"
          tabIndex={0}
          onClick={() => setShowAll(!showAll)}
        >
          <span>
            {showAll
              ? 'Collapse sections'
              : `Show all sections (${sortedSections.length - 3} more)`}
          </span>
          <IconArrow
            className={showAll ? 'SearchResult__showAll--collapse' : null}
          />
        </div>
      )}
    </div>
  );
}

export function MobileSearchResult({
  course,
}: SearchResultProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showNUPath, setShowNUPath] = useState(false);
  const [showPrereq, setShowPrereq] = useState(false);
  const [showCoreq, setShowCoreq] = useState(false);
  const { user } = useUser();
  const userIsWatchingClass = user?.followedCourses?.includes(
    Keys.getClassHash(course)
  );
  const sortedSections = useMemo(() => sortSections(course.sections), [course]);
  const { showAll, setShowAll, renderedSections, hideShowAll } = useShowAll(
    sortedSections
  );

  const { optionalDisplay, creditsString } = useResultDetail(course);

  const renderNUPaths = (): ReactElement => (
    // eslint-disable-next-line react/prop-types
    <div>
      {course.nupath.length > 0 ? (
        <div> {course.nupath.join(', ')}</div>
      ) : (
        <span className="empty"> None</span>
      )}
    </div>
  );

  return (
    <div className="MobileSearchResult">
      <div
        className={
          expanded
            ? 'MobileSearchResult__header--expanded'
            : 'MobileSearchResult__header'
        }
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
      >
        <IconCollapseExpand />
        <span className="MobileSearchResult__header--classTitle">
          {`${course.subject} ${course.classId} : ${course.name}`}
        </span>
      </div>
      {expanded && (
        <div className="MobileSearchResult__panel">
          <div className="MobileSearchResult__panel--mainContainer">
            <div className="MobileSearchResult__panel--infoStrings">
              <a
                href={course.prettyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >{`Updated ${getLastUpdateString(course)}`}</a>
              <span>{creditsString()}</span>
            </div>
            <div
              className={
                showMore
                  ? 'MobileSearchResult__panel--description'
                  : 'MobileSearchResult__panel--descriptionHidden'
              }
            >
              {course.desc}
            </div>
            <div
              className="MobileSearchResult__panel--showMore"
              role="button"
              tabIndex={0}
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Show less' : 'Show more'}
            </div>
            <MobileCollapsableDetail
              title="NUPATH"
              expand={showNUPath}
              setExpand={setShowNUPath}
              renderChildren={renderNUPaths}
            />
            <MobileCollapsableDetail
              title="PREREQUISITES"
              expand={showPrereq}
              setExpand={setShowPrereq}
              renderChildren={() => optionalDisplay(PrereqType.PREREQ, course)}
            />
            <MobileCollapsableDetail
              title="COREQUISITES"
              expand={showCoreq}
              setExpand={setShowCoreq}
              renderChildren={() => optionalDisplay(PrereqType.COREQ, course)}
            />
            <div className="MobileSearchResult__panel--notifContainer">
              <SignUpForNotifications course={course} />
            </div>
          </div>
          <div className="MobileSearchResult__panel--sections">
            {renderedSections.map((section) => (
              <MobileSectionPanel
                key={section.crn}
                section={section}
                showNotificationSwitches={userIsWatchingClass}
              />
            ))}
          </div>
          {!hideShowAll && (
            <div
              className="MobileSearchResult__showAll"
              role="button"
              tabIndex={0}
              onClick={() => setShowAll(!showAll)}
            >
              <span>{showAll ? 'Collapse sections' : 'Show all sections'}</span>
              <IconArrow
                className={
                  showAll ? 'MobileSearchResult__showAll--collapse' : ''
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
