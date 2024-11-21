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
import SignUpForSectionNotifications from '../../notifications/SignUpForSectionNotifications';
import { Course, PrereqType, Section } from '../../types';
import MobileCollapsableDetail from './MobileCollapsableDetail';
import { DesktopSectionPanel, MobileSectionPanel } from './SectionPanel';
import useResultDetail from './useResultDetail';
import useShowAll from './useShowAll';
import { MobileSearchResult, SearchResult } from './SearchResult';
import Keys from '../../Keys';
import CourseCheckBox from '../../panels/CourseCheckBox';
interface CourseResultProps {
  course: Course;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
}

const sortSections = (sections: Section[], userInfo?: UserInfo): Section[] => {
  // TODO (sam 2023-03-09): remove this `cloneDeep` call once we can remove the `useMemo` from `CourseResult`.
  const sortedSections = cloneDeep(sections);
  const subscribedSectionIds = new Set(userInfo?.sectionIds ?? []);
  sortedSections.sort((a: Section, b: Section) => {
    const aHash = Keys.getSectionHash(a);
    const bHash = Keys.getSectionHash(b);
    if (subscribedSectionIds.has(aHash) === subscribedSectionIds.has(bHash)) {
      if (a.seatsRemaining === b.seatsRemaining) {
        return b.waitRemaining - a.waitRemaining;
      }
      return b.seatsRemaining - a.seatsRemaining;
    } else if (subscribedSectionIds.has(aHash)) {
      return -1;
    } else {
      return 1;
    }
  });
  return sortedSections;
};

export function CourseResult({
  course,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: CourseResultProps): ReactElement {
  const router = useRouter();
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  // TODO (sam 2023-03-09): this is necessary because of `useShowAll`, which should likely not be coupled to courses.
  const sortedSections = useMemo(
    () => sortSections(course.sections, userInfo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course]
  );
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
            </div>
          </div>
        </>
      }
      afterBody={
        <>
          <table
            className={`SearchResult__sectionTable ${
              hideShowAll ? 'SearchResult__sectionTable--hidden' : ''
            }`}
          >
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
                <th> Notifications </th>
              </tr>
            </thead>
            <tbody>
              {renderedSections.map((section) => (
                <DesktopSectionPanel
                  key={section.crn}
                  section={section}
                  userInfo={userInfo}
                  fetchUserInfo={fetchUserInfo}
                  onSignIn={onSignIn}
                />
              ))}
            </tbody>
            {hasAtLeastOneSectionFull() && (
              <tfoot>
                <tr>
                  <td colSpan={5}>New available sections</td>
                  <td>
                    <CourseCheckBox
                      course={course}
                      userInfo={userInfo}
                      onSignIn={onSignIn}
                      fetchUserInfo={fetchUserInfo}
                    />
                  </td>
                </tr>
              </tfoot>
            )}
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
  fetchUserInfo,
  onSignIn,
}: CourseResultProps): ReactElement {
  const [showMore, setShowMore] = useState(false);
  const [showNUPath, setShowNUPath] = useState(false);
  const [showPrereq, setShowPrereq] = useState(false);
  const [showCoreq, setShowCoreq] = useState(false);
  const sortedSections = useMemo(
    () => sortSections(course.sections, userInfo),
    [course]
  );
  const { showAll, setShowAll, renderedSections, hideShowAll } = useShowAll(
    sortedSections
  );

  const { optionalDisplay } = useResultDetail(course);

  const hasAtLeastOneSectionFull = (): boolean => {
    return course.sections.some((e) => {
      return e.seatsRemaining <= 0 && e.seatsCapacity > 0;
    });
  };

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
              <LastUpdatedMobile lastUpdateTime={course.lastUpdateTime} />
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
              <SignUpForSectionNotifications
                course={course}
                userInfo={userInfo}
                showNotificationSignup={hasAtLeastOneSectionFull()}
                fetchUserInfo={fetchUserInfo}
                onSignIn={onSignIn}
              />
            </div>
          </div>
          <div className="MobileSearchResult__panel--sections">
            {renderedSections.map((section) => (
              <MobileSectionPanel
                key={section.crn}
                section={section}
                userInfo={userInfo}
                fetchUserInfo={fetchUserInfo}
                onSignIn={onSignIn}
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
        </>
      }
    />
  );
}
