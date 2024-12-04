import { ReactElement, useState } from 'react';
import { Section, SubscriptionCourse, UserInfo } from '../types';
import { LastUpdated } from '../common/LastUpdated';
import { DesktopSectionPanel } from '../ResultsPage/Results/SectionPanel';
import { getFormattedSections } from '../ResultsPage/ResultsLoader';
import DropdownArrow from '../icons/DropdownArrow.svg';
import CourseCheckBox from '../panels/CourseCheckBox';

type ClassCardWrapperType = {
  headerLeft: ReactElement;
  headerRight?: ReactElement;
  body?: ReactElement;
  afterBody?: ReactElement;
};

const ClassCardWrapper = ({
  headerLeft,
  headerRight,
  body,
  afterBody,
}: ClassCardWrapperType): ReactElement => {
  return (
    <div className="SearchResult">
      <div className="SearchResult__header">
        <div className="SearchResult__header--left">{headerLeft}</div>
        {headerRight}
      </div>
      {body}
      {afterBody}
    </div>
  );
};

type ClassCardType = {
  course: SubscriptionCourse;
  sections: Section[];
  userInfo: UserInfo;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
};

export const ClassCard = ({
  course,
  sections,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: ClassCardType): ReactElement => {
  const sectionsFormatted: Section[] = getFormattedSections(sections);
  const [areSectionsHidden, setAreSectionsHidden] = useState(true);

  const hasAtLeastOneSectionFull = (): boolean => {
    return course.sections.some((e) => {
      return e.seatsRemaining <= 0 && e.seatsCapacity > 0;
    });
  };

  return (
    <ClassCardWrapper
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
      headerRight={<button>Unsubscribe</button>}
      body={
        <>
          <div style={{ display: areSectionsHidden ? 'none' : 'block' }}>
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
                  <th> Notifications </th>
                </tr>
              </thead>
              <tbody>
                {sectionsFormatted.map((section) => (
                  <DesktopSectionPanel
                    key={section.crn}
                    section={section}
                    userInfo={userInfo}
                    fetchUserInfo={fetchUserInfo}
                    // We don't really have access to onSignIn until header is added to the subscription page. Passing in a fake onSignIn
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
                        fetchUserInfo={fetchUserInfo}
                        onSignIn={onSignIn}
                      />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      }
      afterBody={
        <>
          <div
            className={
              areSectionsHidden
                ? 'SearchResult__showAll--subscriptionButton'
                : 'SearchResult__showAll'
            }
            role="button"
            tabIndex={0}
            onClick={() => setAreSectionsHidden(!areSectionsHidden)}
          >
            <span>{areSectionsHidden ? 'Show sections' : 'Hide sections'}</span>
            <DropdownArrow
              className={
                areSectionsHidden
                  ? 'SearchResult__showAll--subscriptionCollapsed'
                  : 'SearchResult__showAll--subscriptionExpanded'
              }
            />
          </div>
        </>
      }
    />
  );
};
