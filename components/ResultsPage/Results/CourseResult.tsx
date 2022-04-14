import { Markup } from 'interweave';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import React, { ReactElement, useMemo, useState } from 'react';
import {
  CreditsDisplay,
  CreditsDisplayMobile,
} from '../../common/CreditsDisplay';
import { LastUpdated, LastUpdatedMobile } from '../../common/LastUpdated';
import { UserInfo } from '../../types';
import IconArrow from '../../icons/IconArrow';
import IconNotepad from '../../icons/IconNotepad';
import SignUpForNotifications from '../../notifications/SignUpForNotifications';
import { Course, PrereqType, Section } from '../../types';
import MobileCollapsableDetail from './MobileCollapsableDetail';
import { DesktopSectionPanel, MobileSectionPanel } from './SectionPanel';
import useResultDetail from './useResultDetail';
import useShowAll from './useShowAll';
import { MobileSearchResult, SearchResult } from './SearchResult';
interface CourseResultProps {
  course: Course;
  userInfo: UserInfo;
  onSignIn: (token: string) => void;
  fetchUserInfo: () => void;
}

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

export function CourseResult({
  course,
  userInfo,
  onSignIn,
  fetchUserInfo,
}: CourseResultProps): ReactElement {
  const router = useRouter();
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const sortedSections = useMemo(() => sortSections(course.sections), [course]);
  const { optionalDisplay } = useResultDetail(course);

  const { showAll, setShowAll, renderedSections, hideShowAll } = useShowAll(
    sortedSections
  );

  const feeString =
    course.feeDescription && course.feeAmount
      ? `${course.feeDescription} - $${course.feeAmount.toLocaleString()}`
      : null;

  const hasAtLeastOneSectionFull = (): boolean => {
    return course.sections.some((e) => {
      return e.seatsRemaining <= 0 && e.seatsCapacity > 0;
    });
  };

  return (
    <SearchResult
      headerLeft={
        <>
          <span className="SearchResult__header--classTitle">
            {course.subject} {course.classId}: {course.name}
          </span>
          <LastUpdated
            host={course.host}
            prettyUrl={course.prettyUrl}
            lastUpdateTime={course.lastUpdateTime}
            className="SearchResult__header--sub"
          />
        </>
      }
      headerRight={
        <CreditsDisplay
          maxCredits={course.maxCredits}
          minCredits={course.minCredits}
        ></CreditsDisplay>
      }
      body={
        <>
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
              <div
                onClick={() =>
                  router.push(
                    `/${campus}/${termId}/classPage/${course.subject}/${course.classId}`
                  )
                }
              >
                <div className="view-more-info-container">
                  <IconNotepad className="notepad-icon" />
                  <span>View more info for this class</span>
                </div>
              </div>

              <SignUpForNotifications
                course={course}
                userInfo={userInfo}
                onSignIn={onSignIn}
                showNotificationSignup={hasAtLeastOneSectionFull()}
                fetchUserInfo={fetchUserInfo}
              />
            </div>
          </div>
        </>
      }
      afterBody={
        <>
          <table className="SearchResult__sectionTable">
            <thead>
              <tr>
                <th>
                  <div
                    className="inlineBlock"
                    data-tip="Course Reference Number"
                  >
                    CRN
                  </div>
                </th>
                <th> Professors </th>
                <th> Meetings </th>
                <th> Campus </th>
                <th> Seats </th>
                {userInfo && <th> Notifications </th>}
              </tr>
            </thead>
            <tbody>
              {renderedSections.map((section) => (
                <DesktopSectionPanel
                  key={section.crn}
                  section={section}
                  userInfo={userInfo}
                  fetchUserInfo={fetchUserInfo}
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
        </>
      }
    />
  );
}

export function MobileCourseResult({
  course,
  userInfo,
  onSignIn,
  fetchUserInfo,
}: CourseResultProps): ReactElement {
  const [showMore, setShowMore] = useState(false);
  const [showNUPath, setShowNUPath] = useState(false);
  const [showPrereq, setShowPrereq] = useState(false);
  const [showCoreq, setShowCoreq] = useState(false);
  const sortedSections = useMemo(() => sortSections(course.sections), [course]);
  const { showAll, setShowAll, renderedSections, hideShowAll } = useShowAll(
    sortedSections
  );

  const { optionalDisplay } = useResultDetail(course);

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
    <MobileSearchResult
      headerLeft={
        <span className="MobileSearchResult__header--classTitle">
          {course.subject} {course.classId} : {course.name}
        </span>
      }
      body={
        <>
          <div className="MobileSearchResult__panel--mainContainer">
            <div className="MobileSearchResult__panel--infoStrings">
              <LastUpdatedMobile
                host={course.host}
                prettyUrl={course.prettyUrl}
                lastUpdateTime={course.lastUpdateTime}
              />
              <CreditsDisplayMobile
                maxCredits={course.maxCredits}
                minCredits={course.minCredits}
              />
            </div>
            <div
              className={
                showMore
                  ? 'MobileSearchResult__panel--description'
                  : 'MobileSearchResult__panel--descriptionHidden'
              }
            >
              <Markup content={course.desc} />
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
              <SignUpForNotifications
                course={course}
                userInfo={userInfo}
                onSignIn={onSignIn}
                showNotificationSignup={false}
                fetchUserInfo={fetchUserInfo}
              />
            </div>
          </div>
          <div className="MobileSearchResult__panel--sections">
            {renderedSections.map((section) => (
              <MobileSectionPanel key={section.crn} section={section} />
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
        </>
      }
    />
  );
}
